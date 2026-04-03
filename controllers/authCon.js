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
          role: role || "user",
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

    const { data: user, error } = await supabase
      .from("user_profiles")
      .select(`*,health_centers (h_name)`)
      .eq("user_name", user_name)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "ไม่พบชื่อผู้ใช้งานนี้" });
    }

    const isMatch = await bcrypt.compare(pass_word, user.pass_word);

    if (!isMatch) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    const h_name = user.health_centers
      ? user.health_centers.h_name
      : "ไม่ทราบชื่อหน่วยงาน";
    // 3. ถ้าผ่านหมด ให้สร้าง JWT Token
    const token = jwt.sign(
      {
        username: user.user_name,
        full_name: user.full_name,
        hcode: user.hcode,
        h_name: h_name,
        role: user.role,
      },
      process.env.JWT_SECRET, // กุญแจ suphanpublichealth
      { expiresIn: "24h" }, // อายุตั๋ว 1 วัน
    );

    res.json({
      message: "Login Successful",
      token: token,
      user: {
        full_name: user.full_name,
        hcode: user.hcode,
        h_name: h_name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};
