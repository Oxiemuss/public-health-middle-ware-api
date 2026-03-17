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
    console.log("Body ที่ส่งมา:", req.body);
    try {
        const { 
            cid, 
            full_name, 
            birth_date, 
            tel, 
            from_hcode, 
            to_hcode, 
            status,
            refer_pic_path, 
            cid_card_pic_path 
        } = req.body;

        // 1. Validation เบื้องต้น (ข้อมูลสำคัญห้ามว่าง)
        if (!cid || !full_name || !from_hcode || !to_hcode) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลสำคัญให้ครบ (เลขบัตร, ชื่อ, ต้นทาง, ปลายทาง)" });
        }

        // 2. บันทึกลงตาราง referrals
        const { data, error } = await supabase
            .from('referrals')
            .insert([
                { 
                    cid, 
                    full_name, 
                    birth_date, 
                    tel, 
                    from_hcode, 
                    to_hcode, 
                    status: status || 'pending', // ถ้าไม่ส่งสถานะมา ให้เป็น pending ไว้ก่อน
                    refer_pic_path, 
                    cid_card_pic_path,
                    created_at: new Date()
                }
            ])
            .select();

        if (error) {
            // ดัก Error กรณี hcode ไม่มีจริงในระบบ
            if (error.code === '23503') {
                return res.status(400).json({ error: "รหัสสถานพยาบาลต้นทางหรือปลายทางไม่ถูกต้อง" });
            }
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: "บันทึกข้อมูลการส่งตัวสำเร็จ",
            refer_id: data[0].rid,
            data: data[0]
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateRefer = async (req, res) => {
    try {
        const { 
            rid, // ใช้ rid เป็น Key ในการค้นหา
            cid, 
            full_name, 
            birth_date, 
            tel, 
            from_hcode, 
            to_hcode, 
            status,
            refer_pic_path, 
            cid_card_pic_path 
        } = req.body;

        if (!rid) {
            return res.status(400).json({ error: "กรุณาระบุ rid ที่ต้องการแก้ไข" });
        }

        const updateData = {};

        // เช็คค่าว่าง: ถ้าส่งมาเป็น "" หรือ undefined จะไม่ทับค่าเดิม
        if (cid !== undefined && cid !== "") updateData.cid = cid;
        if (full_name !== undefined && full_name !== "") updateData.full_name = full_name;
        if (birth_date !== undefined && birth_date !== "") updateData.birth_date = birth_date;
        if (tel !== undefined && tel !== "") updateData.tel = tel;
        if (from_hcode !== undefined && from_hcode !== "") updateData.from_hcode = from_hcode;
        if (to_hcode !== undefined && to_hcode !== "") updateData.to_hcode = to_hcode;
        if (status !== undefined && status !== "") updateData.status = status;
        if (refer_pic_path !== undefined && refer_pic_path !== "") updateData.refer_pic_path = refer_pic_path;
        if (cid_card_pic_path !== undefined && cid_card_pic_path !== "") updateData.cid_card_pic_path = cid_card_pic_path;

        updateData.updated_at = new Date();

        const { data, error } = await supabase
            .from('referrals')
            .update(updateData)
            .eq('rid', rid)
            .select();

        if (error) {
            // ดัก Error กรณี hcode ใหม่ไม่มีในระบบ
            if (error.code === '23503') {
                return res.status(400).json({ error: "รหัสสถานพยาบาลต้นทางหรือปลายทางไม่ถูกต้อง" });
            }
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลใบส่งตัวรหัสนี้" });
        }

        res.json({ message: "อัปเดตข้อมูลใบส่งตัวสำเร็จ", updatedData: data[0] });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};