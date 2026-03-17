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


exports.delUser = async (req, res) => {
    try {
        const { user_name } = req.body; // รับ user_name จาก Body

        if (!user_name) {
            return res.status(400).json({ error: "กรุณาระบุ user_name ที่ต้องการลบ" });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('user_name', user_name) // เปลี่ยนมาเทียบกับ user_name
            .select();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานนี้" });
        }

        res.json({ message: `ลบผู้ใช้ ${user_name} เรียบร้อยแล้ว`, deletedData: data });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { user_name, full_name, hcode, role, is_active } = req.body;

        // 1. ตรวจสอบว่ามี user_name มาเพื่อใช้เป็น Key ในการค้นหาหรือไม่
        if (!user_name) {
            return res.status(400).json({ error: "กรุณาระบุ user_name ที่ต้องการแก้ไข" });
        }

        const updateData = {};

        // 2. ตรวจสอบข้อมูล: ถ้าไม่ใช่ undefined และไม่ใช่ค่าว่าง ("") ให้เตรียมอัปเดต
        // hcode ตรงนี้จะสามารถอัปเดตเปลี่ยนค่าได้แล้ว
        if (full_name !== undefined && full_name !== "") updateData.full_name = full_name;
        if (hcode !== undefined && hcode !== "") updateData.hcode = hcode;
        if (role !== undefined && role !== "") updateData.role = role;
        
        // สำหรับ Boolean (is_active) เช็คแค่ว่ามีการส่งค่ามาหรือไม่
        if (is_active !== undefined) updateData.is_active = is_active;

        updateData.updated_at = new Date();

        // 3. ถ้าไม่มีข้อมูลอะไรส่งมาเลยนอกจาก user_name ก็ไม่ต้องอัปเดต
        if (Object.keys(updateData).length <= 1) {
            return res.status(400).json({ error: "ไม่มีข้อมูลใหม่สำหรับการอัปเดต" });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('user_name', user_name) // ใช้ user_name ในการระบุตัวคนที่จะแก้
            .select();

        if (error) {
            // ดัก Error กรณีเปลี่ยน hcode เป็นรหัสที่ไม่มีอยู่จริงในตาราง HC
            if (error.code === '23503') {
                return res.status(400).json({ error: "รหัส hcode ที่ระบุไม่มีอยู่ในระบบ" });
            }
            return res.status(400).json({ error: error.message });
        }

        if (data.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานชื่อนี้" });
        }

        res.json({ 
            message: "อัปเดตข้อมูลสำเร็จ", 
            updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at'),
            updatedData: data[0] 
        });
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getUserByUsername = async (req, res) => {
    try {
        const { user_name } = req.body;

        if (!user_name) {
            return res.status(400).json({ error: "กรุณาระบุ user_name ใน Body" });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                *,
                health_centers (
                    h_name
                )
            `)
            .eq('user_name', user_name)
            .single(); // ดึงมาแค่รายการเดียว (เพราะ username ไม่ควรซ้ำ)

        if (error || !data) {
            return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานนี้" });
        }

        // ปรับโครงสร้างข้อมูล (Flatten) ให้ใช้ง่ายขึ้น
        const result = {
            ...data,
            hospital_name: data.health_centers ? data.health_centers.h_name : 'ไม่ระบุสังกัด'
        };
        delete result.health_centers; // ลบ object ซ้อนออกเพื่อให้คลีน

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};