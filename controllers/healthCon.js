const supabase = require('../supabaseClient');

exports.addHealthCenter = async (req, res) => {
    const { hcode, h_name, role, h_district, h_province, contact_number } = req.body;

    if (!hcode || !h_name || !role) {
        return res.status(400).json({ error: "กรุณาระบุ hcode, h_name และ role ให้ครบถ้วน" });
    }

    const { data, error } = await supabase
        .from('health_centers')
        .insert([{ 
            hcode, h_name, role, 
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
        const { hcode, h_name, h_type, h_district } = req.body;

        // hcode คือหัวใจสำคัญ ห้ามว่าง
        if (!hcode) {
            return res.status(400).json({ error: "กรุณาระบุ hcode ที่ต้องการแก้ไข" });
        }

        const updateData = {};

        // เช็คค่าว่าง: ถ้าส่งมาเป็น "" หรือไม่ส่งมา จะไม่ทับค่าเดิมใน DB
        if (h_name !== undefined && h_name !== "") updateData.h_name = h_name;
        if (h_type !== undefined && h_type !== "") updateData.h_type = h_type;
        if (h_district !== undefined && h_district !== "") updateData.h_district = h_district;

        updateData.updated_at = new Date();

        // ถ้าไม่มีข้อมูลให้อัปเดตเลยนอกจาก hcode
        if (Object.keys(updateData).length <= 1) {
            return res.status(400).json({ error: "ไม่มีข้อมูลใหม่สำหรับการอัปเดต" });
        }

        const { data, error } = await supabase
            .from('health_centers')
            .update(updateData)
            .eq('hcode', hcode)
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบรหัสหน่วยบริการนี้ในระบบ" });
        }

        res.json({ message: "อัปเดตข้อมูลหน่วยบริการสำเร็จ", updatedData: data[0] });
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