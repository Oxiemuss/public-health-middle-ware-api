CREATE TABLE health_centers (
    id UUID PRIMARY KEY DEFAULT auth.uid(),           -- UID
    hcode VARCHAR(5) UNIQUE NOT NULL,                 -- รหัสสถานพยาบาล 5 
    h_name VARCHAR(255) NOT NULL,                      -- ชื่อ รพสต รพ
    role  VARCHAR(50) NOT NULL,                       -- sender / reciever
    h_district VARCHAR(100) DEFAULT 'บางปลาม้า'      -- อำเภอ
    h_province VARCHAR(100) DEFAULT 'สุพรรณบุรี'       -- จังหวัด
    contact_number VARCHAR(20),                        -- เบอร์ติดต่อ
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE referrals (
    rid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cid VARCHAR(13) NOT NULL,                               -- เลขบัตรประชาชน
    from_hcode VARCHAR(5) REFERENCES health_centers(hcode), -- รหัส รพ.สต. ต้นทาง
    to_hcode VARCHAR(5) REFERENCES health_centers(hcode),   -- รหัส รพ. ปลายทาง
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    tel VARCHAR(20),
    rlt_name VARCHAR(255),                                  -- ชื่อผู้ติดต่อ/ญาติ
    rlt_contact_number VARCHAR(20),                         -- เบอร์โทรญาติ
    -- ส่วนของการเก็บไฟล์ (เก็บเป็น Path ใน Supabase Storage)
    refer_pic_path TEXT,                                    -- ที่อยู่ไฟล์รูปใบส่งตัว
    cid_card_pic_path TEXT,                                 -- ที่อยู่ไฟล์รูปบัตรประชาชน
    -- สถานะการดำเนินงาน
    status VARCHAR(50) DEFAULT 'pending',        -- pending, accepted, completed
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);



CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), --Auth
    username VARCHAR(50) UNIQUE NOT NULL,         -- เอาไว้ Login
    password TEXT NOT NULL,                 -- เก็บ Password 
    full_name VARCHAR(255),
    hcode VARCHAR(5) REFERENCES health_centers(hcode), -- ผูกกับ รพ.สต./รพ.
    role VARCHAR(20) DEFAULT 'user',             -- 'user', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX idx_referrals_from_hcode ON referrals(from_hcode);
CREATE INDEX idx_referrals_to_hcode ON referrals(to_hcode);
CREATE INDEX idx_referrals_status ON referrals(status);







