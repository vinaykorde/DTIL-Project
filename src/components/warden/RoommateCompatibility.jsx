import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Users, CheckCircle, Search, UserPlus } from 'lucide-react';
import Button from '../common/Button';

export default function RoommateCompatibility() {
  const { students, updateStudent, rooms, showToast } = useData();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // Available students looking for a roommate
  const lookingStudents = students.filter(s => s.roommateStatus === 'Looking');

  // Matching Logic
  const calculateCompatibility = (studentA, studentB) => {
    let score = 0;
    const matchDetails = [];

    // Sleep Time (20%)
    if (studentA.sleepTime === studentB.sleepTime) {
      score += 20;
      matchDetails.push({ factor: 'Sleep Time', match: true });
    } else {
      matchDetails.push({ factor: 'Sleep Time', match: false });
    }

    // Study Time (20%)
    if (studentA.studyTime === studentB.studyTime) {
      score += 20;
      matchDetails.push({ factor: 'Study Time', match: true });
    } else {
      matchDetails.push({ factor: 'Study Time', match: false });
    }

    // Cleanliness (20%)
    const cleanlinessLevels = { Low: 1, Medium: 2, High: 3 };
    const cleanDiff = Math.abs((cleanlinessLevels[studentA.cleanliness] || 2) - (cleanlinessLevels[studentB.cleanliness] || 2));
    if (cleanDiff === 0) {
      score += 20;
      matchDetails.push({ factor: 'Cleanliness', match: true });
    } else if (cleanDiff === 1) {
      score += 10;
      matchDetails.push({ factor: 'Cleanliness', match: true }); // partial match visually
    } else {
      matchDetails.push({ factor: 'Cleanliness', match: false });
    }

    // Food Preference (25%)
    if (studentA.foodPreference === studentB.foodPreference) {
      score += 25;
      matchDetails.push({ factor: 'Food Preference', match: true });
    } else {
      matchDetails.push({ factor: 'Food Preference', match: false });
    }

    // Light Preference (5%)
    if (studentA.lightPreference === studentB.lightPreference) {
      score += 5;
      matchDetails.push({ factor: 'Light Preference', match: true });
    } else {
      matchDetails.push({ factor: 'Light Preference', match: false });
    }

    // Department (10%)
    if (studentA.department === studentB.department) {
      score += 10;
      matchDetails.push({ factor: 'Department', match: true });
    } else {
      matchDetails.push({ factor: 'Department', match: false });
    }

    return { score, matchDetails };
  };

  const handleFindRoommate = () => {
    if (!selectedStudentId) return;
    
    setIsLoading(true);
    setRecommendations(null);

    // Simulate API delay for professional feel
    setTimeout(() => {
      const targetStudent = students.find(s => s.id === selectedStudentId);
      
      const potentialMatches = students
        .filter(s => s.id !== selectedStudentId && s.roommateStatus === 'Looking')
        .map(otherStudent => {
          const { score, matchDetails } = calculateCompatibility(targetStudent, otherStudent);
          return { student: otherStudent, score, matchDetails };
        })
        .sort((a, b) => b.score - a.score);

      setRecommendations(potentialMatches);
      setIsLoading(false);
    }, 1200);
  };

  const handleAssignRoommate = (partner) => {
    const studentA = students.find(s => s.id === selectedStudentId);
    const studentB = partner;

    // Find an available double or triple room in the same hostel
    const availableRoom = rooms.find(r => 
      r.hostel === studentA.hostel && 
      (r.status === 'Available' || r.status === 'Partially Occupied') &&
      r.capacity - r.occupied >= 2
    );

    if (availableRoom) {
       updateStudent(studentA.id, { 
         roommateStatus: 'Assigned',
         room: availableRoom.roomNumber,
         bed: 'Bed A'
       });
       updateStudent(studentB.id, { 
         roommateStatus: 'Assigned',
         room: availableRoom.roomNumber,
         bed: 'Bed B'
       });
       showToast(`Roommate assigned successfully. Both allocated to Room ${availableRoom.roomNumber}.`, 'success');
    } else {
       // If no room is found but we still want to pair them
       updateStudent(studentA.id, { roommateStatus: 'Assigned' });
       updateStudent(studentB.id, { roommateStatus: 'Assigned' });
       showToast(`Roommate assigned successfully, but no free room available right now.`, 'success');
    }

    setSelectedStudentId('');
    setRecommendations(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Users size={20} color="var(--primary-600)" />
            Roommate Compatibility
          </div>
          <div className="card-subtitle">Automatically find the most compatible roommate for a student.</div>
        </div>
      </div>

      <div style={{ padding: '1.25rem', paddingTop: '0' }}>
        <div className="flex-mobile-col" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <select 
            className="w-full-mobile"
            value={selectedStudentId} 
            onChange={(e) => setSelectedStudentId(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '0.65rem 1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              fontSize: '0.95rem',
              backgroundColor: 'var(--slate-50)',
              color: 'var(--slate-900)'
            }}
          >
            <option value="">Select Student ▼</option>
            {lookingStudents.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
            ))}
          </select>
          <Button 
            className="w-full-mobile"
            variant="primary" 
            icon={Search} 
            onClick={handleFindRoommate}
            disabled={!selectedStudentId || isLoading}
          >
            Find Compatible Roommate
          </Button>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
             <div style={{
                display: 'inline-block',
                width: 24,
                height: 24,
                border: '3px solid var(--primary-200)',
                borderTopColor: 'var(--primary-600)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
             <div>Finding the most compatible roommate...</div>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {/* Top Recommendation */}
            <div style={{ 
              border: '2px solid var(--primary-500)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '1.5rem',
              backgroundColor: 'var(--primary-50)',
              marginBottom: '1.5rem',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: '-12px', 
                left: '1.5rem', 
                background: 'var(--primary-600)', 
                color: 'white',
                padding: '2px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Recommended Roommate
              </div>
              
              <div className="flex-mobile-col-start" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                    {recommendations[0].student.name} is the Recommended Roommate for {students.find(s => s.id === selectedStudentId)?.name}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary-700)', fontWeight: 600, marginTop: '0.25rem' }}>
                    Compatibility Score: {recommendations[0].score}%
                  </div>
                </div>
                <Button 
                  className="w-full-mobile"
                  variant="primary" 
                  icon={UserPlus} 
                  onClick={() => handleAssignRoommate(recommendations[0].student)}
                >
                  Assign Roommate
                </Button>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '0.75rem', 
                marginTop: '1.5rem',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                paddingTop: '1rem'
              }}>
                {recommendations[0].matchDetails.map((detail, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: detail.match ? 'var(--success-700)' : 'var(--slate-400)',
                    fontSize: '0.875rem',
                    fontWeight: detail.match ? 600 : 400
                  }}>
                    {detail.match ? <CheckCircle size={16} /> : <div style={{width:16,height:16,borderRadius:'50%',border:'1px solid currentColor',opacity:0.5}}/>}
                    {detail.factor}
                  </div>
                ))}
              </div>
            </div>

            {/* Other Recommendations */}
            {recommendations.length > 1 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>Other Compatible Students</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recommendations.slice(1).map((rec, idx) => (
                    <div key={rec.student.id} style={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '0.75rem 1rem', 
                      backgroundColor: 'var(--slate-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                        {idx + 2}. {rec.student.name}
                      </div>
                      <div style={{ fontWeight: 700, color: rec.score >= 70 ? 'var(--success-600)' : 'var(--warning-600)' }}>
                        {rec.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {recommendations && recommendations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
            No compatible students available yet.
          </div>
        )}
      </div>
    </div>
  );
}
