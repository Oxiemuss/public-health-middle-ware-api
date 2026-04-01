const supabase = require("../supabaseClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { user_name, pass_word, full_name, hcode, role } = req.body;

    if (!user_name || !pass_word || !hcode) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // Hash รหัสผ่านก่อนเก็บ (Security First!)
    const hashedPassword = await bcrypt.hash(pass_word, 8);

    const { data, error } = await supabase
      .from("user_profiles")
      .insert([
        {
          user_name,
          pass_word: hashedPassword,
          full_name,
          hcode,
          role: role || "user", // ถ้าไม่ส่งมาให้เป็น user ปกติ
          is_active: true,
        },
      ])
      .select();

    if (error) {
      // ดัก Error กรณี Username ซ้ำ (Duplicate Key)
      if (error.code === "23505")
        return res.status(400).json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" });
      return res.status(400).json({ error: error.message });
    }

    res
      .status(201)
      .json({ message: "ลงทะเบียนสำเร็จ", username: data[0].username });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { user_name, pass_word } = req.body;

    // 1. ดึงข้อมูล User จากตาราง users ใน Supabase
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_name", user_name)
      .single();

    // ถ้าไม่เจอ User หรือ Error
    if (error || !user) {
      return res.status(401).json({ error: "ไม่พบชื่อผู้ใช้งานนี้" });
    }

    // 2. ตรวจสอบรหัสผ่าน (เทียบรหัสที่พิมพ์มา กับ ตัวที่ Hash ใน DB)
    const isMatch = await bcrypt.compare(pass_word, user.pass_word);

    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    // 3. ถ้าผ่านหมด ให้สร้าง JWT Token
    // Payload: ใส่ข้อมูลที่เราอยากให้หน้าบ้านเอาไปใช้ (เช่น ชื่อ, หน่วยงาน, สิทธิ์)
    const token = jwt.sign(
      {
        username: user.user_name,
        full_name: user.full_name,
        hcode: user.hcode,
        role: user.role,
      },
      process.env.JWT_SECRET, // กุญแจ suphanpublichealth
      { expiresIn: "24h" }, // อายุตั๋ว 1 วัน
    );

    // 4. ส่ง Token และข้อมูลเบื้องต้นกลับไปให้หน้าบ้าน
    res.json({
      message: "Login Successful",
      token: token,
      user: {
        full_name: user.full_name,
        hcode: user.hcode,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};
