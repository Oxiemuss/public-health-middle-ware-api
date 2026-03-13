const supabase = require('../supabaseClient');

exports.addUser = async (req, res) => {
    const { user_name, pass_word, full_name, hcode, role } = req.body;

    if (!user_name || !pass_word || !hcode) {
        return res.status(400).json({ error: "กรุณาระบุ user_name, pass_word และ hcode ให้ครบถ้วน" });
    }

    const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ 
            user_name, pass_word, full_name, hcode, 
            role: role || 'user', 
            is_active: true 
        }])
        .select('id, user_name, pass_word, full_name, hcode, role');

    if (error) {
        if (error.code === '23505') return res.status(403).json({ error: "Username นี้ถูกใช้งานแล้ว" });
        if (error.code === '23503') return res.status(400).json({ error: "รหัส hcode หน่วยงานไม่ถูกต้อง" });
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ message: "สร้างบัญชีผู้ใช้งานเรียบร้อย", data: data[0] });
};


exports.getAllUsers = async (req, res) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            health_centers (
                h_name
            )
        `) // ใช้ *, ตามด้วยชื่อตารางที่ต้องการ Join
        .order('hcode', { ascending: true });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // ปรับโครงสร้างข้อมูล (Flatten)
    const result = data.map(user => ({
        full_name: user.full_name,
        hcode: user.hcode, // ดึงมาได้เพราะใช้ *
        role: user.role,   // ดึงมาได้เพราะใช้ *
        hospital_name: user.health_centers ? user.health_centers.h_name : 'ไม่ระบุสังกัด'
    }));

    res.json(result);
};