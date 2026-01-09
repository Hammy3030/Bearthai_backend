export class MockDataHelper {
  static generateMockUsers() {
    return [
      {
        email: 'teacher1@bearthai.com',
        password: 'password123',
        role: 'TEACHER',
        name: 'ครูสมศรี',
        school: 'โรงเรียนวัดปทุมวนาราม'
      },
      {
        email: 'teacher2@bearthai.com',
        password: 'password123',
        role: 'TEACHER',
        name: 'ครูประไพ',
        school: 'โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ'
      },
      {
        email: 'student1@bearthai.local',
        password: 'password123',
        role: 'STUDENT',
        name: 'เด็กชายสมชาย',
        studentCode: 'STU001'
      },
      {
        email: 'student2@bearthai.local',
        password: 'password123',
        role: 'STUDENT',
        name: 'เด็กหญิงสมหญิง',
        studentCode: 'STU002'
      }
    ];
  }

  static generateMockClassrooms() {
    return [
      {
        name: 'ป.1/1',
        teacherId: null // Will be set after teacher creation
      },
      {
        name: 'ป.1/2',
        teacherId: null // Will be set after teacher creation
      }
    ];
  }

  static generateMockStudents() {
    return [
      {
        name: 'เด็กชายกิตติ',
        grade: '1',
        studentCode: 'STU001'
      },
      {
        name: 'เด็กหญิงกัลยา',
        grade: '1',
        studentCode: 'STU002'
      },
      {
        name: 'เด็กชายก้อง',
        grade: '1',
        studentCode: 'STU003'
      },
      {
        name: 'เด็กหญิงกานดา',
        grade: '1',
        studentCode: 'STU004'
      },
      {
        name: 'เด็กชายขจร',
        grade: '1',
        studentCode: 'STU005'
      },
      {
        name: 'เด็กหญิงขนิษฐา',
        grade: '1',
        studentCode: 'STU006'
      },
      {
        name: 'เด็กชายคณิต',
        grade: '1',
        studentCode: 'STU007'
      },
      {
        name: 'เด็กหญิงคณิตา',
        grade: '1',
        studentCode: 'STU008'
      },
      {
        name: 'เด็กชายจารุ',
        grade: '1',
        studentCode: 'STU009'
      },
      {
        name: 'เด็กหญิงจินดา',
        grade: '1',
        studentCode: 'STU010'
      }
    ];
  }

  static generateMockLessons() {
    return [
      {
        title: 'พยัญชนะไทย ก-ฮ',
        content: `
          <h2>พยัญชนะไทย ก-ฮ</h2>
          <p>พยัญชนะไทยมีทั้งหมด 44 ตัว แบ่งเป็น 3 หมู่</p>
          <h3>หมู่ที่ 1: ก-ด</h3>
          <p>ก ข ฃ ค ฅ ฆ ง จ ฉ ช ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด</p>
          <h3>หมู่ที่ 2: ต-บ</h3>
          <p>ต ถ ท ธ น บ ป ผ ฝ พ ฟ ภ ม</p>
          <h3>หมู่ที่ 3: ย-ฮ</h3>
          <p>ย ร ล ว ศ ษ ส ห ฬ อ ฮ</p>
          <h3>แบบฝึกหัด</h3>
          <p>1. เขียนพยัญชนะ ก-ฮ ตามลำดับ</p>
          <p>2. หาคำที่ขึ้นต้นด้วยพยัญชนะแต่ละตัว</p>
        `,
        audioUrl: '/audio/lesson1.mp3',
        imageUrl: '/images/lesson1.jpg',
        order: 1
      },
      {
        title: 'สระไทย',
        content: `
          <h2>สระไทย</h2>
          <p>สระไทยมีทั้งหมด 32 เสียง แบ่งเป็น 4 กลุ่ม</p>
          <h3>สระเสียงสั้น</h3>
          <p>อะ อิ อุ เอะ แอะ โอะ เอาะ</p>
          <h3>สระเสียงยาว</h3>
          <p>อา อี อู เอ แอ โอ ออ</p>
          <h3>สระประสม</h3>
          <p>เอีย เอือ อัว อำ ใอ ไอ</p>
          <h3>แบบฝึกหัด</h3>
          <p>1. อ่านสระไทยให้ถูกต้อง</p>
          <p>2. เขียนคำที่มีสระต่างกัน</p>
        `,
        audioUrl: '/audio/lesson2.mp3',
        imageUrl: '/images/lesson2.jpg',
        order: 2
      },
      {
        title: 'การผสมคำ',
        content: `
          <h2>การผสมคำ</h2>
          <p>การผสมคำคือการนำพยัญชนะและสระมาผสมกันเป็นคำ</p>
          <h3>ตัวอย่างการผสมคำ</h3>
          <p>ก + อา = กา</p>
          <p>ข + อี = ขี</p>
          <p>ค + อู = คู</p>
          <p>ง + เอ = เง</p>
          <h3>แบบฝึกหัด</h3>
          <p>1. ผสมพยัญชนะกับสระให้เป็นคำ</p>
          <p>2. อ่านคำที่ผสมแล้ว</p>
        `,
        audioUrl: '/audio/lesson3.mp3',
        imageUrl: '/images/lesson3.jpg',
        order: 3
      }
    ];
  }

  static generateMockTests() {
    return [
      {
        title: 'แบบทดสอบก่อนเรียน - พยัญชนะไทย',
        type: 'PRE_TEST',
        timeLimit: 30,
        questions: [
          {
            question: 'พยัญชนะไทยมีทั้งหมดกี่ตัว?',
            options: ['42 ตัว', '44 ตัว', '46 ตัว', '48 ตัว'],
            correctAnswer: 1,
            explanation: 'พยัญชนะไทยมีทั้งหมด 44 ตัว'
          },
          {
            question: 'พยัญชนะตัวแรกของพยัญชนะไทยคือ?',
            options: ['ก', 'ข', 'ค', 'ง'],
            correctAnswer: 0,
            explanation: 'พยัญชนะตัวแรกคือ ก'
          },
          {
            question: 'พยัญชนะตัวสุดท้ายของพยัญชนะไทยคือ?',
            options: ['อ', 'ฮ', 'ย', 'ร'],
            correctAnswer: 1,
            explanation: 'พยัญชนะตัวสุดท้ายคือ ฮ'
          }
        ]
      },
      {
        title: 'แบบทดสอบหลังเรียน - พยัญชนะไทย',
        type: 'POST_TEST',
        timeLimit: 30,
        questions: [
          {
            question: 'พยัญชนะ ก อยู่ในหมู่ที่เท่าไหร่?',
            options: ['หมู่ที่ 1', 'หมู่ที่ 2', 'หมู่ที่ 3', 'หมู่ที่ 4'],
            correctAnswer: 0,
            explanation: 'พยัญชนะ ก อยู่ในหมู่ที่ 1'
          },
          {
            question: 'พยัญชนะ ง อยู่ในหมู่ที่เท่าไหร่?',
            options: ['หมู่ที่ 1', 'หมู่ที่ 2', 'หมู่ที่ 3', 'หมู่ที่ 4'],
            correctAnswer: 0,
            explanation: 'พยัญชนะ ง อยู่ในหมู่ที่ 1'
          }
        ]
      },
      {
        title: 'แบบทดสอบก่อนเรียน - สระไทย',
        type: 'PRE_TEST',
        timeLimit: 25,
        questions: [
          {
            question: 'สระไทยมีทั้งหมดกี่เสียง?',
            options: ['30 เสียง', '32 เสียง', '34 เสียง', '36 เสียง'],
            correctAnswer: 1,
            explanation: 'สระไทยมีทั้งหมด 32 เสียง'
          },
          {
            question: 'สระเสียงสั้นมีกี่ตัว?',
            options: ['6 ตัว', '7 ตัว', '8 ตัว', '9 ตัว'],
            correctAnswer: 1,
            explanation: 'สระเสียงสั้นมี 7 ตัว'
          }
        ]
      }
    ];
  }

  static generateMockGames() {
    return [
      {
        title: 'เกมจับคู่พยัญชนะ',
        type: 'MATCHING',
        settings: {
          difficulty: 'easy',
          timeLimit: 60,
          pairs: [
            { item1: 'ก', item2: 'ไก่' },
            { item1: 'ข', item2: 'ไข่' },
            { item1: 'ค', item2: 'ควาย' },
            { item1: 'ง', item2: 'งู' }
          ]
        }
      },
      {
        title: 'เกมลากวางสระ',
        type: 'DRAG_DROP',
        settings: {
          difficulty: 'medium',
          timeLimit: 90,
          items: [
            { word: 'กา', vowels: ['อ', 'า'] },
            { word: 'ขี', vowels: ['อ', 'ี'] },
            { word: 'คู', vowels: ['อ', 'ู'] }
          ]
        }
      },
      {
        title: 'เกมโยงคำ',
        type: 'WORD_CONNECT',
        settings: {
          difficulty: 'easy',
          timeLimit: 120,
          connections: [
            { word1: 'กบ', word2: 'บิน' },
            { word1: 'แมว', word2: 'วิ่ง' },
            { word1: 'ปลา', word2: 'ว่าย' }
          ]
        }
      },
      {
        title: 'เกมจำพยัญชนะ',
        type: 'MEMORY',
        settings: {
          difficulty: 'medium',
          timeLimit: 180,
          cards: ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ']
        }
      },
      {
        title: 'เกมตอบคำถาม',
        type: 'QUIZ',
        settings: {
          difficulty: 'hard',
          timeLimit: 150,
          questions: [
            {
              question: 'พยัญชนะไทยตัวไหนที่ออกเสียงเหมือนกับ "ก"',
              options: ['ข', 'ค', 'ง', 'จ'],
              correctAnswer: 2
            }
          ]
        }
      }
    ];
  }

  static generateMockAnnouncements() {
    return [
      {
        title: 'ประกาศเปิดเรียน',
        content: 'ขอเรียนเชิญนักเรียนทุกคนเตรียมความพร้อมสำหรับการเรียนภาษาไทยในภาคเรียนใหม่',
        type: 'info'
      },
      {
        title: 'ประกาศการสอบ',
        content: 'จะมีการสอบวัดผลการเรียนรู้ในวันที่ 15 ของทุกเดือน กรุณาเตรียมตัวให้พร้อม',
        type: 'warning'
      },
      {
        title: 'ประกาศกิจกรรมพิเศษ',
        content: 'มีกิจกรรมการแข่งขันอ่านออกเขียนได้ในสัปดาห์หน้า ผู้สนใจสามารถสมัครได้ที่ครูประจำชั้น',
        type: 'success'
      }
    ];
  }

  static generateMockNotifications() {
    return [
      {
        title: 'มีงานใหม่',
        message: 'คุณมีแบบทดสอบใหม่ที่ต้องทำ',
        type: 'info'
      },
      {
        title: 'เกมใหม่มาแล้ว',
        message: 'เกมการเรียนรู้ใหม่พร้อมให้เล่นแล้ว',
        type: 'success'
      },
      {
        title: 'คำเตือน',
        message: 'กรุณาทำแบบทดสอบก่อนเรียนให้เสร็จ',
        type: 'warning'
      }
    ];
  }
}
