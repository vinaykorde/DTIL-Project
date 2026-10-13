/**
 * Mock Data for College Hostel Management System
 * Presentation-ready realistic dataset for DTIL academic project.
 */

export const mockHostels = [
  { id: 'H1', name: 'Vikramshilla Boys Hostel', code: 'KBH', type: 'Boys', totalRooms: 45, warden: 'Dr. Satish Sharma' },
  { id: 'H2', name: 'Godavari Boys Hostel', code: 'GBH', type: 'Boys', totalRooms: 40, warden: 'Prof. S. Patil' },
  { id: 'H3', name: 'Ganga Girls Hostel', code: 'GGH', type: 'Girls', totalRooms: 50, warden: 'Dr. M. Kulkarni' },
  { id: 'H4', name: 'Yamuna Girls Hostel', code: 'YGH', type: 'Girls', totalRooms: 35, warden: 'Mrs. A. Deshmukh' },
];

export const mockWardens = [
  {
    id: 'W101',
    name: 'Dr. Satish Sharma',
    email: 'warden@hostel.com',
    phone: '+91 98234 56789',
    hostel: 'Vikramshilla Boys Hostel',
    cabin: 'Admin Block, Ground Floor',
    department: 'Mechanical Engg.',
    joinedDate: '2021-08-15'
  },
  {
    id: 'W102',
    name: 'Prof. S. Patil',
    email: 'patil.warden@hostel.com',
    phone: '+91 98234 56790',
    hostel: 'Godavari Boys Hostel',
    cabin: 'GBH Ground Floor',
    department: 'Civil Engg.',
    joinedDate: '2022-01-10'
  },
  {
    id: 'W103',
    name: 'Dr. M. Kulkarni',
    email: 'kulkarni.warden@hostel.com',
    phone: '+91 98234 56791',
    hostel: 'Ganga Girls Hostel',
    cabin: 'GGH Wing A',
    department: 'Computer Engg.',
    joinedDate: '2020-07-01'
  }
];

export const mockRooms = [
  {
    id: 'R-101',
    roomNumber: '101',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '1st Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 2,
    status: 'Full',
    amenities: ['Wi-Fi', 'Attached Bath', 'Balcony', 'Study Desks'],
    occupants: ['Aarav Patel', 'Rohan Mehta']
  },
  {
    id: 'R-102',
    roomNumber: '102',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '1st Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 1,
    status: 'Partially Occupied',
    amenities: ['Wi-Fi', 'Attached Bath', 'Study Desks'],
    occupants: ['Vikram Shinde']
  },
  {
    id: 'R-103',
    roomNumber: '103',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '1st Floor',
    roomType: 'Triple Sharing',
    capacity: 3,
    occupied: 0,
    status: 'Available',
    amenities: ['Wi-Fi', 'Common Bath', 'Ceiling Fan'],
    occupants: []
  },
  {
    id: 'R-204',
    roomNumber: '204',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '2nd Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 2,
    status: 'Full',
    amenities: ['High-speed Wi-Fi', 'Attached Bath', 'Balcony', 'AC'],
    occupants: ['Vinay Korde (Demo Student)', 'Aditya Verma']
  },
  {
    id: 'R-205',
    roomNumber: '205',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '2nd Floor',
    roomType: 'Single Room',
    capacity: 1,
    occupied: 1,
    status: 'Full',
    amenities: ['Single Bed', 'Wi-Fi', 'Attached Bath', 'Study Table'],
    occupants: ['Kunal Jadhav']
  },
  {
    id: 'R-206',
    roomNumber: '206',
    hostel: 'Vikramshilla Boys Hostel',
    floor: '2nd Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 0,
    status: 'Available',
    amenities: ['Wi-Fi', 'Attached Bath', 'Study Desks'],
    occupants: []
  },
  {
    id: 'R-301',
    roomNumber: '301',
    hostel: 'Godavari Boys Hostel',
    floor: '3rd Floor',
    roomType: 'Triple Sharing',
    capacity: 3,
    occupied: 2,
    status: 'Partially Occupied',
    amenities: ['Wi-Fi', 'Common Bath', 'Lockers'],
    occupants: ['Siddharth Rao', 'Nikhil Joshi']
  },
  {
    id: 'R-302',
    roomNumber: '302',
    hostel: 'Godavari Boys Hostel',
    floor: '3rd Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 2,
    status: 'Full',
    amenities: ['Wi-Fi', 'Attached Bath'],
    occupants: ['Gaurav Kulkarni', 'Yash Gaikwad']
  },
  {
    id: 'R-G101',
    roomNumber: '101',
    hostel: 'Ganga Girls Hostel',
    floor: '1st Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 2,
    status: 'Full',
    amenities: ['Wi-Fi', 'Attached Bath', 'Balcony'],
    occupants: ['Ananya Sen', 'Pooja Hegde']
  },
  {
    id: 'R-G102',
    roomNumber: '102',
    hostel: 'Ganga Girls Hostel',
    floor: '1st Floor',
    roomType: 'Double Sharing',
    capacity: 2,
    occupied: 1,
    status: 'Partially Occupied',
    amenities: ['Wi-Fi', 'Attached Bath'],
    occupants: ['Riya Sharma']
  },
  {
    id: 'R-G201',
    roomNumber: '201',
    hostel: 'Ganga Girls Hostel',
    floor: '2nd Floor',
    roomType: 'Single Room',
    capacity: 1,
    occupied: 0,
    status: 'Available',
    amenities: ['Wi-Fi', 'Attached Bath', 'Study Table'],
    occupants: []
  }
];

export const mockStudents = [
  {
    id: 'STU-2024-001',
    name: 'Vinay Korde',
    email: 'student@hostel.com',
    phone: '+91 91234 56780',
    department: 'Information Technology',
    year: '3rd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: null,
    bed: null,
    status: 'Active',
    attendanceRate: 88,
    pendingFees: 0,
    emergencyContact: '+91 98220 11223 (Father)',
    address: 'Plot 42, Shivajinagar, Pune, MH',
    sleepTime: 'Late',
    studyTime: 'Night',
    cleanliness: 'High',
    foodPreference: 'Vegetarian',
    lightPreference: 'Dim',
    roommateStatus: 'Looking'
  },
  {
    id: 'STU-2024-002',
    name: 'Aditya Verma',
    email: 'aditya.v@college.edu',
    phone: '+91 91234 56781',
    department: 'Computer Science & Engg',
    year: '3rd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: '204',
    bed: 'Bed B',
    status: 'Active',
    attendanceRate: 92,
    pendingFees: 0,
    emergencyContact: '+91 98220 44556 (Mother)',
    address: 'Lane 5, Baner Road, Pune, MH',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'Medium',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Assigned'
  },
  {
    id: 'STU-2024-003',
    name: 'Aarav Patel',
    email: 'aarav.p@college.edu',
    phone: '+91 91234 56782',
    department: 'Information Technology',
    year: '2nd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: null,
    bed: null,
    status: 'Active',
    attendanceRate: 85,
    pendingFees: 4500,
    emergencyContact: '+91 98220 99887 (Father)',
    address: 'Navrangpura, Ahmedabad, GJ',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'Medium',
    foodPreference: 'Vegetarian',
    lightPreference: 'Dim',
    roommateStatus: 'Looking'
  },
  {
    id: 'STU-2024-004',
    name: 'Rohan Mehta',
    email: 'rohan.m@college.edu',
    phone: '+91 91234 56783',
    department: 'Information Technology',
    year: '2nd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: '101',
    bed: 'Bed B',
    status: 'Active',
    attendanceRate: 90,
    pendingFees: 0,
    emergencyContact: '+91 98220 33441 (Brother)',
    address: 'Borivali West, Mumbai, MH',
    sleepTime: 'Late',
    studyTime: 'Night',
    cleanliness: 'Low',
    foodPreference: 'Non-Vegetarian',
    lightPreference: 'Dim',
    roommateStatus: 'Assigned'
  },
  {
    id: 'STU-2024-005',
    name: 'Vikram Shinde',
    email: 'vikram.s@college.edu',
    phone: '+91 91234 56784',
    department: 'Mechanical Engg',
    year: '4th Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: null,
    bed: null,
    status: 'Active',
    attendanceRate: 79,
    pendingFees: 2000,
    emergencyContact: '+91 98220 77889 (Father)',
    address: 'Satara Road, Kolhapur, MH',
    sleepTime: 'Late',
    studyTime: 'Evening',
    cleanliness: 'Medium',
    foodPreference: 'Non-Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Looking'
  },
  {
    id: 'STU-2024-006',
    name: 'Kunal Jadhav',
    email: 'kunal.j@college.edu',
    phone: '+91 91234 56785',
    department: 'Information Technology',
    year: '3rd Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: null,
    bed: null,
    status: 'Active',
    attendanceRate: 94,
    pendingFees: 0,
    emergencyContact: '+91 98220 55667 (Father)',
    address: 'Cidco, Aurangabad, MH',
    sleepTime: 'Late',
    studyTime: 'Night',
    cleanliness: 'High',
    foodPreference: 'Vegetarian',
    lightPreference: 'Dim',
    roommateStatus: 'Looking'
  },
  {
    id: 'STU-2024-007',
    name: 'Siddharth Rao',
    email: 'siddharth.r@college.edu',
    phone: '+91 91234 56786',
    department: 'Civil Engg',
    year: '1st Year',
    hostel: 'Vikramshilla Boys Hostel',
    room: null,
    bed: null,
    status: 'Active',
    attendanceRate: 86,
    pendingFees: 0,
    emergencyContact: '+91 98220 66778 (Father)',
    address: 'Jayanagar, Bengaluru, KA',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'High',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Looking'
  },
  {
    id: 'STU-2024-008',
    name: 'Ananya Sen',
    email: 'ananya.s@college.edu',
    phone: '+91 91234 56787',
    department: 'Computer Science & Engg',
    year: '3rd Year',
    hostel: 'Ganga Girls Hostel',
    room: '101',
    bed: 'Bed A',
    status: 'Active',
    attendanceRate: 96,
    pendingFees: 0,
    emergencyContact: '+91 98220 11112 (Mother)',
    address: 'Salt Lake, Kolkata, WB',
    sleepTime: 'Early',
    studyTime: 'Morning',
    cleanliness: 'High',
    foodPreference: 'Non-Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Assigned'
  },
  {
    id: 'STU-2024-009',
    name: 'Pooja Hegde',
    email: 'pooja.h@college.edu',
    phone: '+91 91234 56788',
    department: 'Information Technology',
    year: '3rd Year',
    hostel: 'Ganga Girls Hostel',
    room: '101',
    bed: 'Bed B',
    status: 'Active',
    attendanceRate: 91,
    pendingFees: 1500,
    emergencyContact: '+91 98220 22223 (Father)',
    address: 'Panaji, Goa',
    sleepTime: 'Late',
    studyTime: 'Night',
    cleanliness: 'Medium',
    foodPreference: 'Vegetarian',
    lightPreference: 'Dim',
    roommateStatus: 'Assigned'
  },
  {
    id: 'STU-2024-010',
    name: 'Riya Sharma',
    email: 'riya.s@college.edu',
    phone: '+91 91234 56789',
    department: 'Electrical Engg',
    year: '2nd Year',
    hostel: 'Ganga Girls Hostel',
    room: '102',
    bed: 'Bed A',
    status: 'Active',
    attendanceRate: 87,
    pendingFees: 0,
    emergencyContact: '+91 98220 33334 (Mother)',
    address: 'Malviya Nagar, Jaipur, RJ',
    sleepTime: 'Early',
    studyTime: 'Evening',
    cleanliness: 'High',
    foodPreference: 'Vegetarian',
    lightPreference: 'Bright',
    roommateStatus: 'Assigned'
  }
];

export const mockComplaints = [
  {
    id: 'CMP-2026-081',
    studentId: 'STU-2024-001',
    studentName: 'Vinay Korde',
    room: '204',
    hostel: 'Vikramshilla Boys Hostel',
    category: 'Internet',
    subject: 'Wi-Fi connectivity drop in Room 204',
    description: 'High latency and frequent disconnects during evening study hours (7 PM - 11 PM). Access point speed test drops below 1 Mbps.',
    priority: 'Medium',
    status: 'Pending',
    date: '2026-09-08',
    resolvedDate: null,
    notes: 'Assigned to IT network maintenance team.'
  },
  {
    id: 'CMP-2026-080',
    studentId: 'STU-2024-003',
    studentName: 'Aarav Patel',
    room: '101',
    hostel: 'Vikramshilla Boys Hostel',
    category: 'Electrical',
    subject: 'Ceiling Fan regulator sparking and not adjusting speed',
    description: 'The ceiling fan regulator makes cracking sound when rotated and remains stuck at full speed.',
    priority: 'High',
    status: 'In Progress',
    date: '2026-09-07',
    resolvedDate: null,
    notes: 'Electrician Mr. Dinesh has visited and ordered replacement regulator.'
  },
  {
    id: 'CMP-2026-079',
    studentId: 'STU-2024-005',
    studentName: 'Vikram Shinde',
    room: '102',
    hostel: 'Vikramshilla Boys Hostel',
    category: 'Plumbing',
    subject: 'Bathroom tap leaking continuously',
    description: 'Cold water tap in the attached washroom leaks water droplets causing wastage.',
    priority: 'Low',
    status: 'Resolved',
    date: '2026-09-05',
    resolvedDate: '2026-09-06',
    notes: 'Washer replaced by hostel maintenance staff.'
  },
  {
    id: 'CMP-2026-078',
    studentId: 'STU-2024-008',
    studentName: 'Ananya Sen',
    room: '101',
    hostel: 'Ganga Girls Hostel',
    category: 'Food',
    subject: 'Mess dinner quality inquiry and hygiene',
    description: 'Mess food quality was below standard on Sunday dinner. Vegetables were uncooked.',
    priority: 'Medium',
    status: 'In Progress',
    date: '2026-09-06',
    resolvedDate: null,
    notes: 'Mess committee has scheduled inspection with catering contractor.'
  },
  {
    id: 'CMP-2026-077',
    studentId: 'STU-2024-007',
    studentName: 'Siddharth Rao',
    room: '301',
    hostel: 'Godavari Boys Hostel',
    category: 'Cleaning',
    subject: '3rd floor corridor cleaning request',
    description: 'Dustbin on 3rd floor west wing was not cleared yesterday.',
    priority: 'Low',
    status: 'Resolved',
    date: '2026-09-04',
    resolvedDate: '2026-09-05',
    notes: 'Corridor swept and dustbin replaced.'
  }
];

export const mockNotices = [
  {
    id: 'NOT-101',
    title: 'Hostel Maintenance & Water Tank Cleaning Schedule',
    description: 'Water supply will be restricted on Saturday, 14th Sept from 9:00 AM to 2:00 PM for biannual water tank deep cleaning and chlorination. Kindly store sufficient water in advance.',
    category: 'Maintenance',
    priority: 'High',
    postedBy: 'Chief Warden Office',
    date: '2026-09-09',
    targetRole: 'All'
  },
  {
    id: 'NOT-102',
    title: 'Strict Curfew and Gate Entry Timings Notice',
    description: 'All residents are strictly reminded that hostel main gates close at 10:00 PM sharp. Late entries require prior permission from the respective hostel warden via the official portal.',
    category: 'Discipline',
    priority: 'High',
    postedBy: 'Dr. Satish Sharma (Warden)',
    date: '2026-09-07',
    targetRole: 'All'
  },
  {
    id: 'NOT-103',
    title: 'Annual Inter-Hostel Sports & Cultural Meet 2026',
    description: 'Registrations are now open for Cricket, Badminton, Table Tennis, Chess and Cultural Night. Team captains must submit squad lists to the sports committee by 18th Sept.',
    category: 'Events',
    priority: 'Medium',
    postedBy: 'Hostel Affairs Council',
    date: '2026-09-05',
    targetRole: 'Students'
  },
  {
    id: 'NOT-104',
    title: 'High-Speed Wi-Fi Router Firmware Upgrades',
    description: 'IT Services will perform fiber router maintenance across Vikramshilla and Godavari hostels on Thursday midnight. Expect 20 minutes intermittent downtime.',
    category: 'IT Services',
    priority: 'Low',
    postedBy: 'Campus Network Admin',
    date: '2026-09-03',
    targetRole: 'All'
  }
];

export const mockLeaveRequests = [
  {
    id: 'LEV-501',
    studentId: 'STU-2024-001',
    studentName: 'Vinay Korde',
    room: '204',
    hostel: 'Vikramshilla Boys Hostel',
    fromDate: '2026-09-12',
    toDate: '2026-09-15',
    reason: 'Family function (Cousin marriage ceremony) at hometown.',
    emergencyContact: '+91 98220 11223',
    status: 'Pending',
    appliedAt: '2026-09-09',
    remarks: ''
  },
  {
    id: 'LEV-502',
    studentId: 'STU-2024-004',
    studentName: 'Rohan Mehta',
    room: '101',
    hostel: 'Vikramshilla Boys Hostel',
    fromDate: '2026-09-10',
    toDate: '2026-09-12',
    reason: 'Attending IEEE Student Technical Conference in Mumbai.',
    emergencyContact: '+91 98220 33441',
    status: 'Approved',
    appliedAt: '2026-09-06',
    remarks: 'Approved with permission letter attached.'
  },
  {
    id: 'LEV-503',
    studentId: 'STU-2024-008',
    studentName: 'Ananya Sen',
    room: '101',
    hostel: 'Ganga Girls Hostel',
    fromDate: '2026-09-18',
    toDate: '2026-09-22',
    reason: 'Festival holidays visit home.',
    emergencyContact: '+91 98220 11112',
    status: 'Pending',
    appliedAt: '2026-09-08',
    remarks: ''
  },
  {
    id: 'LEV-504',
    studentId: 'STU-2024-005',
    studentName: 'Vikram Shinde',
    room: '102',
    hostel: 'Vikramshilla Boys Hostel',
    fromDate: '2026-08-25',
    toDate: '2026-08-28',
    reason: 'Medical checkup and consultation.',
    emergencyContact: '+91 98220 77889',
    status: 'Approved',
    appliedAt: '2026-08-23',
    remarks: 'Medical certificate verified.'
  }
];

export const mockVisitors = [
  {
    id: 'VIS-901',
    studentId: 'STU-2024-001',
    studentName: 'Vinay Korde',
    room: '204',
    hostel: 'Vikramshilla Boys Hostel',
    visitorName: 'Mr. Dinesh Korde',
    relationship: 'Father',
    phone: '+91 98220 11223',
    visitDate: '2026-09-10',
    visitTime: '04:30 PM',
    status: 'Expected',
    notes: 'Visiting to deliver study materials'
  },
  {
    id: 'VIS-902',
    studentId: 'STU-2024-008',
    studentName: 'Ananya Sen',
    room: '101',
    hostel: 'Ganga Girls Hostel',
    visitorName: 'Mrs. Sharmila Sen',
    relationship: 'Mother',
    phone: '+91 98220 11112',
    visitDate: '2026-09-10',
    visitTime: '02:00 PM',
    status: 'Checked In',
    notes: 'Allowed in visitor guest lounge'
  },
  {
    id: 'VIS-903',
    studentId: 'STU-2024-002',
    studentName: 'Aditya Verma',
    room: '204',
    hostel: 'Vikramshilla Boys Hostel',
    visitorName: 'Suresh Verma',
    relationship: 'Uncle',
    phone: '+91 98220 44556',
    visitDate: '2026-09-08',
    visitTime: '11:00 AM',
    status: 'Completed',
    notes: 'Departed at 12:30 PM'
  }
];

export const mockAttendanceRecords = [
  { studentId: 'STU-2024-001', studentName: 'Vinay Korde', room: '204', hostel: 'Vikramshilla Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-002', studentName: 'Aditya Verma', room: '204', hostel: 'Vikramshilla Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-003', studentName: 'Aarav Patel', room: '101', hostel: 'Vikramshilla Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-004', studentName: 'Rohan Mehta', room: '101', hostel: 'Vikramshilla Boys Hostel', status: 'Absent', date: '2026-09-10' },
  { studentId: 'STU-2024-005', studentName: 'Vikram Shinde', room: '102', hostel: 'Vikramshilla Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-006', studentName: 'Kunal Jadhav', room: '205', hostel: 'Vikramshilla Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-007', studentName: 'Siddharth Rao', room: '301', hostel: 'Godavari Boys Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-008', studentName: 'Ananya Sen', room: '101', hostel: 'Ganga Girls Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-009', studentName: 'Pooja Hegde', room: '101', hostel: 'Ganga Girls Hostel', status: 'Present', date: '2026-09-10' },
  { studentId: 'STU-2024-010', studentName: 'Riya Sharma', room: '102', hostel: 'Ganga Girls Hostel', status: 'Absent', date: '2026-09-10' }
];

export const mockFeeDetails = {
  summary: {
    totalBilled: 45000,
    totalPaid: 45000,
    balanceDue: 0,
    paymentStatus: 'Paid',
    nextDueTerm: 'Spring Semester 2027'
  },
  breakdown: [
    { item: 'Hostel Accommodation (Double AC)', amount: 26000, status: 'Paid', receiptNo: 'RCPT-2026-401' },
    { item: 'Mess Charges (Breakfast, Lunch, Dinner)', amount: 15000, status: 'Paid', receiptNo: 'RCPT-2026-402' },
    { item: 'Hostel Maintenance & High-Speed Wi-Fi', amount: 3000, status: 'Paid', receiptNo: 'RCPT-2026-403' },
    { item: 'Hostel Caution Deposit (Refundable)', amount: 1000, status: 'Paid', receiptNo: 'RCPT-2026-404' }
  ]
};

export const mockAdminStats = {
  totalStudents: 420,
  totalRooms: 170,
  occupiedRooms: 142,
  availableRooms: 28,
  pendingComplaints: 8,
  totalWardens: 4,
  occupancyRate: 83.5,
  complaintBreakdown: {
    Electrical: 12,
    Plumbing: 9,
    Internet: 15,
    Cleaning: 6,
    Food: 8,
    Room: 4,
    Other: 2
  },
  recentActivities: [
    { id: 1, text: 'Warden Dr. Satish Sharma approved leave request for Rohan Mehta (Room 101)', time: '10 mins ago', type: 'leave' },
    { id: 2, text: 'New complaint registered by Vinay Korde: Wi-Fi connectivity drop', time: '45 mins ago', type: 'complaint' },
    { id: 3, text: 'Daily morning attendance recorded for Vikramshilla Boys Hostel (94% present)', time: '2 hours ago', type: 'attendance' },
    { id: 4, text: 'Notice published: Water Tank Cleaning Schedule', time: '4 hours ago', type: 'notice' },
    { id: 5, text: 'Room 206 marked Available after deep sanitation', time: '1 day ago', type: 'room' }
  ]
};

export const mockHostelSettings = {
  name: 'Vikramshilla Boys Hostel',
  latitude: 18.5204,
  longitude: 73.8567,
  radius: 100,
  maxAccuracy: 50
};

export const mockPresenceRecords = [
  {
    id: 'PR-1001',
    studentId: 'STU-2024-001',
    studentName: 'Vinay Korde',
    latitude: 18.52045,
    longitude: 73.85675,
    locationAccuracy: 12,
    distanceFromHostel: 8,
    timestamp: new Date().toISOString(),
    faceMatchStatus: 'VERIFIED',
    locationStatus: 'INSIDE',
    verificationStatus: 'PRESENT'
  }
];
