const supabase = require('../supabaseClient');

exports.getAllRefer = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('referrals')
            .select(`
                *,
                from_hospital:health_centers!referrals_from_hcode_fkey ( h_name ),
                to_hospital:health_centers!referrals_to_hcode_fkey ( h_name )
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false }); // เอาเคสล่าสุดขึ้นก่อน

        if (error) {
            return res.status(400).json({ error: error.message });
        }
        const result = data.map(item => ({
            rid: item.rid,
            cid: item.cid,
            patient_name: item.full_name,
            birth_date: item.birth_date,
            tel: item.tel,
            from_hcode: item.from_hcode,
            from_hospital_name: item.from_hospital ? item.from_hospital.h_name : 'ไม่ทราบต้นทาง',
            to_hcode: item.to_hcode,
            to_hospital_name: item.to_hospital ? item.to_hospital.h_name : 'ไม่ทราบปลายทาง',
            status: item.status,
            refer_pic: item.refer_pic_path,
            cid_pic: item.cid_card_pic_path,
            created_at: item.created_at
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.addRefer = async (req, res) => {
    try {
        // 1. แกะข้อมูลจาก req.body
        const { 
            cid, full_name, birth_date, tel, from_hcode, to_hcode,
            rlt_name, rlt_contact_number, status 
        } = req.body;

        // เช็คข้อมูลสำคัญ (เอา cid ออกจากการบังคับถ้าพี่ไม่ซีเรียสเรื่องเลข 13 หลัก)
        if (!full_name || !from_hcode || !to_hcode) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลสำคัญให้ครบ (ชื่อ, รหัสสถานพยาบาล)" });
        }

        let refer_pic_path = null;
        let cid_card_pic_path = null;

        // --- ส่วนที่ 1: อัปโหลดรูปภาพ ---
        if (req.files) {
            // รูปใบส่งตัว (ดึงจากชื่อ 'refer_pic' ตาม Payload)
            if (req.files['refer_pic'] && req.files['refer_pic'][0]) {
                const file = req.files['refer_pic'][0];
                const fileExt = file.originalname.split('.').pop();
                const fileName = `refer_${cid || 'no-id'}_${Date.now()}.${fileExt}`;
                
                const { data, error: uploadError } = await supabase.storage
                    .from('refer-images')
                    .upload(fileName, file.buffer, { 
                        contentType: file.mimetype,
                        upsert: true 
                    });

                if (uploadError) {
                    console.error("Upload Refer Pic Error:", uploadError);
                } else {
                    refer_pic_path = data.path;
                }
            }

            // รูปบัตรประชาชน (ดึงจากชื่อ 'cid_card_pic' ตาม Payload)
            if (req.files['cid_card_pic'] && req.files['cid_card_pic'][0]) {
                const file = req.files['cid_card_pic'][0];
                const fileExt = file.originalname.split('.').pop();
                const fileName = `cid_${cid || 'no-id'}_${Date.now()}.${fileExt}`;

                const { data, error: uploadError } = await supabase.storage
                    .from('refer-images')
                    .upload(fileName, file.buffer, { 
                        contentType: file.mimetype,
                        upsert: true 
                    });

                if (uploadError) {
                    console.error("Upload CID Pic Error:", uploadError);
                } else {
                    cid_card_pic_path = data.path;
                }
            }
        }

        // --- ส่วนที่ 2: บันทึกลงตาราง referrals ---
        // หมายเหตุ: ตัด 'address' ออกตามที่พี่บอกว่าใน DB ไม่มี
        const { data, error } = await supabase
            .from('referrals')
            .insert([
                { 
                    cid: cid || null, 
                    full_name, 
                    birth_date, 
                    tel, 
                    from_hcode, 
                    to_hcode, 
                    rlt_name, 
                    rlt_contact_number, 
                    status: status || 'pending',
                    refer_pic_path, 
                    cid_card_pic_path,
                    created_at: new Date(),
                    updated_at: new Date() 
                }
            ])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            if (error.code === '23503') return res.status(400).json({ error: "รหัสสถานพยาบาลไม่ถูกต้อง (Foreign Key Error)" });
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: "บันทึกข้อมูลสำเร็จ",
            refer_id: data[0]?.rid || data[0]?.id, // ปรับตามชื่อ PK ของพี่
            data: data[0]
        });

    } catch (err) {
        console.error("Critical Controller Error:", err);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: err.message 
        });
    }
};

exports.updateRefer = async (req, res) => {
    try {
        const { 
            rid, 
            cid, 
            full_name, 
            birth_date, 
            tel, 
            from_hcode, 
            to_hcode,
            rlt_name,               
            rlt_contact_number,    
            status,
            refer_pic_path, 
            cid_card_pic_path,
            is_active              
        } = req.body;

        
        if (!rid) {
            return res.status(400).json({ error: "กรุณาระบุ rid (เลขใบส่งตัว)" });
        }

        const updateData = {};

       
        if (cid !== undefined && cid !== "") updateData.cid = cid;
        if (full_name !== undefined && full_name !== "") updateData.full_name = full_name;
        if (birth_date !== undefined && birth_date !== "") updateData.birth_date = birth_date;
        if (tel !== undefined && tel !== "") updateData.tel = tel;
        if (from_hcode !== undefined && from_hcode !== "") updateData.from_hcode = from_hcode;
        if (to_hcode !== undefined && to_hcode !== "") updateData.to_hcode = to_hcode;
        if (rlt_name !== undefined && rlt_name !== "") updateData.rlt_name = rlt_name;
        if (rlt_contact_number !== undefined && rlt_contact_number !== "") updateData.rlt_contact_number = rlt_contact_number;
        if (status !== undefined && status !== "") updateData.status = status;
        if (refer_pic_path !== undefined && refer_pic_path !== "") updateData.refer_pic_path = refer_pic_path;
        if (cid_card_pic_path !== undefined && cid_card_pic_path !== "") updateData.cid_card_pic_path = cid_card_pic_path;
        
        // สำหรับ Boolean
        if (is_active !== undefined) updateData.is_active = is_active;

        // อัปเดตเวลาแก้ไขล่าสุดเสมอ
        updateData.updated_at = new Date();

        // 3. ยิงคำสั่ง Update ไปที่ Supabase
        const { data, error } = await supabase
            .from('referrals')
            .update(updateData)
            .eq('rid', rid) // ค้นหาด้วยเลข ID (Bigint)
            .select();

        if (error) {
            // ดัก Error FK กรณีแก้ hcode แล้วรหัสไม่มีในระบบ
            if (error.code === '23503') {
                return res.status(400).json({ error: "รหัสสถานพยาบาลต้นทางหรือปลายทางไม่ถูกต้อง" });
            }
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลใบส่งตัวรหัสนี้" });
        }

        res.json({ 
            message: "อัปเดตข้อมูลใบส่งตัวสำเร็จ", 
            updatedData: data[0] 
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Soft Delete: ปิดการใช้งานใบส่งตัว
exports.delRefer = async (req, res) => {
    try {
        const { rid } = req.body;

        if (!rid) {
            return res.status(400).json({ error: "กรุณาระบุ rid ที่ต้องการลบ (Soft Delete)" });
        }

        // แทนที่จะใช้ .delete() เราใช้ .update() เพื่อเปลี่ยนสถานะแทน
        const { data, error } = await supabase
            .from('referrals')
            .update({ 
                is_active: false, 
                updated_at: new Date() 
            })
            .eq('rid', rid)
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลใบส่งตัวรหัสนี้" });
        }

        res.json({ 
            message: `ปิดการใช้งานใบส่งตัวเลขที่ ${rid} (Soft Delete) เรียบร้อยแล้ว`, 
            status: "Inactive",
            data: data[0] 
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};