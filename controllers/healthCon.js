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

// ดึงข้อมูลหน่วยบริการด้วย hcode (ส่งผ่าน Body)
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