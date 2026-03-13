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