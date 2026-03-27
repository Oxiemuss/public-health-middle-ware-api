const supabase = require('../supabaseClient');

exports.addHealthCenter = async (req, res) => {
    const { hcode, h_name, role, h_tumbol, h_district, h_province, contact_number } = req.body;

    if (!hcode || !h_name || !role) {
        return res.status(400).json({ error: "กรุณาระบุ hcode, h_name และ role ให้ครบถ้วน" });
    }

    const { data, error } = await supabase
        .from('health_centers')
        .insert([{ 
            hcode, h_name, role, 
            h_tumbol: h_tumbol , 
            h_district: h_district || 'บางปลาม้า', 
            h_province: h_province || 'สุพรรณบุรี', 
            contact_number, 
            is_active: true 
        }])
        .select();

    if (error) {
        if (error.code === '23505') return res.status(403).json({ error: "รหัส hcode นี้มีอยู่ในระบบแล้ว" });
        return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: "เพิ่มข้อมูลหน่วยบริการสำเร็จ", data: data[0] });
};

exports.getAllHealthCenters = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('health_centers')
            .select('*') // ดึงทุก Column
            .order('h_name', { ascending: true }); // เรียงตามชื่อหน่วยบริการ (ก-ฮ)

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getHealthCenterById = async (req, res) => {
    try {
        const { hcode } = req.body; // รับค่า hcode จาก Body

        if (!hcode) {
            return res.status(400).json({ error: "กรุณาระบุ hcode ใน Body" });
        }

        const { data, error } = await supabase
            .from('health_centers')
            .select('*')
            .eq('hcode', hcode)
            .single(); // ดึงมาแค่รายการเดียว

        if (error || !data) {
            return res.status(404).json({ error: "ไม่พบข้อมูลหน่วยบริการรหัสนี้" });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateHealthCenter = async (req, res) => {
    try {
        const { 
            hcode,      // hcode ตัวเดิม (บังคับส่งมาเพื่อใช้หา Record)
            new_hcode,  // hcode ตัวใหม่ (ถ้าอยากเปลี่ยนเลขรหัส)
            h_name, 
            role,
            h_tumbol, 
            h_district, 
            h_province, 
            contact_number, 
            is_active 
        } = req.body;

        if (!hcode) {
            return res.status(400).json({ error: "กรุณาระบุ hcode เดิมที่ต้องการแก้ไข" });
        }

        const updateData = {};

        // --- จุดสำคัญ: ถ้ามี new_hcode ส่งมา ให้เอาไปทับ hcode เดิม ---
        if (new_hcode !== undefined && new_hcode !== "") updateData.hcode = new_hcode;
        
        if (h_name !== undefined && h_name !== "") updateData.h_name = h_name;
        if (role !== undefined && role !== "") updateData.role = role;
        if (h_tumbol !== undefined && h_tumbol !== "") updateData.h_tumbol;
        if (h_district !== undefined && h_district !== "") updateData.h_district = h_district;
        if (h_province !== undefined && h_province !== "") updateData.h_province = h_province;
        if (contact_number !== undefined && contact_number !== "") updateData.contact_number = contact_number;
        if (is_active !== undefined) updateData.is_active = is_active;

        updateData.updated_at = new Date();

        const { data, error } = await supabase
            .from('health_centers')
            .update(updateData)
            .eq('hcode', hcode) // ค้นหาด้วยรหัสเก่า
            .select();

        if (error) {
            // ดัก Error กรณี new_hcode ไปซ้ำกับที่มีอยู่แล้ว
            if (error.code === '23505') {
                return res.status(400).json({ error: "รหัส hcode ใหม่นี้มีอยู่ในระบบแล้ว" });
            }
            // ดัก Error กรณีมีข้อมูลอื่น (Referrals) อ้างอิง hcode เก่าอยู่ (ถ้าไม่ได้ตั้ง Cascade)
            if (error.code === '23503') {
                return res.status(400).json({ error: "ไม่สามารถเปลี่ยน hcode ได้เนื่องจากมีการเชื่อมโยงข้อมูลการส่งตัวอยู่" });
            }
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบรหัสหน่วยบริการเดิมในระบบ" });
        }

        res.json({ 
            message: "อัปเดตข้อมูลและรหัสหน่วยบริการสำเร็จ", 
            updatedData: data[0] 
        });

    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.delHealthCenter = async (req, res) => {
    try {
        const { hcode } = req.body;

        if (!hcode) {
            return res.status(400).json({ error: "กรุณาระบุ hcode ที่ต้องการลบ" });
        }

        const { data, error } = await supabase
            .from('health_centers')
            .delete()
            .eq('hcode', hcode)
            .select();

        if (error) {
            // ดัก Error กรณีมีการใช้งาน hcode นี้อยู่ในตาราง user_profiles (ถ้าไม่ได้ตั้ง ON DELETE SET NULL)
            if (error.code === '23503') {
                return res.status(400).json({ error: "ไม่สามารถลบได้ เนื่องจากมีรายชื่อผู้ใช้งานสังกัดหน่วยบริการนี้อยู่" });
            }
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });
        }

        res.json({ message: `ลบหน่วยบริการรหัส ${hcode} สำเร็จ`, deletedData: data });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};