import { supabase } from './supabase';
import type { ClassItem, Assignment, Submission } from './classroom';

// ============ КЛАСИ ============

export async function fetchAllClasses(): Promise<ClassItem[]> {
  if (!supabase) return [];
  try {
    const { data: classesData, error: classesError } = await supabase.from('classes').select('*').order('created_at', { ascending: false });
    if (classesError) throw classesError;

    const { data: studentsData } = await supabase.from('class_students').select('*');
    const { data: assignmentsData } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    const { data: submissionsData } = await supabase.from('assignment_submissions').select('*');
    const { data: postsData } = await supabase.from('class_posts').select('*').order('created_at', { ascending: false });

    return (classesData || []).map(c => {
      const classStudents = (studentsData || []).filter(s => s.class_id === c.id);
      const classAssignments = (assignmentsData || []).filter(a => a.class_id === c.id);
      const classPosts = (postsData || []).filter(p => p.class_id === c.id);

      return {
        id: c.id,
        name: c.name,
        section: c.section,
        code: c.code,
        teacherName: c.teacher_name,
        acceptJoins: c.accept_joins,
        students: classStudents.map(s => ({ id: s.student_id, name: s.student_name })),
        assignments: classAssignments.map(a => ({
          id: a.id,
          title: a.title,
          instructions: a.instructions,
          due: a.due,
          questions: a.questions,
          createdAt: a.created_at,
          submissions: (submissionsData || [])
            .filter(s => s.assignment_id === a.id)
            .map(s => ({
              studentId: s.student_id,
              name: s.student_name,
              score: s.score,
              max: s.max_score,
              items: s.items,
              answers: s.answers,
              submittedAt: s.submitted_at,
              late: s.late
            }))
        })),
        posts: classPosts.map(p => ({
          id: p.id,
          kind: p.kind,
          text: p.text,
          assignmentId: p.assignment_id,
          createdAt: p.created_at
        }))
      } as ClassItem;
    });
  } catch (e) {
    console.error('Помилка завантаження класів:', e);
    return [];
  }
}

export async function createClassInDb(classItem: ClassItem): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const realTeacherId = user?.id || 'teacher-001';

    const { error } = await supabase.from('classes').insert({
      id: classItem.id,
      name: classItem.name,
      section: classItem.section,
      code: classItem.code,
      teacher_id: realTeacherId,
      teacher_name: classItem.teacherName,
      accept_joins: classItem.acceptJoins
    });
    
    if (error) throw error;
    return true;
  } catch (e: any) {
    console.error('Помилка створення класу:', e.message);
    return false;
  }
}

export async function updateClassInDb(classId: string, data: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.section !== undefined) updateData.section = data.section;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.acceptJoins !== undefined) updateData.accept_joins = data.acceptJoins;
    
    const { error } = await supabase.from('classes').update(updateData).eq('id', classId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка оновлення класу:', e);
    return false;
  }
}

export async function deleteClassFromDb(classId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка видалення класу:', e);
    return false;
  }
}

// ============ УЧНІ ============

export async function addStudentToClass(classId: string, studentId: string, studentName: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('class_students').upsert({
      class_id: classId,
      student_id: studentId,
      student_name: studentName
    });
    if (error) throw error; // 🔥 ТЕПЕР МИ БАЧИМО ПОМИЛКУ
    return true;
  } catch (e) {
    console.error('Помилка додавання учня:', e);
    return false;
  }
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('class_students').delete().eq('class_id', classId).eq('student_id', studentId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка видалення учня:', e);
    return false;
  }
}

// ============ ЗАВДАННЯ ============

export async function createAssignmentInDb(classId: string, a: Assignment): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('assignments').insert({
      id: a.id,
      class_id: classId,
      title: a.title,
      instructions: a.instructions,
      due: a.due,
      questions: a.questions,
      created_at: a.createdAt || new Date().toISOString()
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка створення завдання:', e);
    return false;
  }
}

export async function deleteAssignmentFromDb(assignmentId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка видалення завдання:', e);
    return false;
  }
}

// ============ РЕЗУЛЬТАТИ УЧНІВ ============

export async function saveSubmissionToDb(
  assignmentId: string,
  studentId: string,
  studentName: string,
  score: number,
  maxScore: number,
  items: any[],
  answers: any,
  late: boolean
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('assignment_submissions').upsert({
      assignment_id: assignmentId,
      student_id: studentId,
      student_name: studentName,
      score,
      max_score: maxScore,
      items,
      answers,
      late,
      submitted_at: new Date().toISOString()
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка збереження результату:', e);
    return false;
  }
}

// ============ РЕЗУЛЬТАТИ ДЛЯ МОНІТОРИНГУ СЕСІЙ ============

export async function fetchSessionSubmissions(sessionId: string): Promise<any[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('submissions')
      .select('*')
      .eq('session_id', sessionId);
    
    return (data || []).map(s => ({
      id: s.id,
      name: s.student_name,
      score: s.score,
      maxScore: s.max_score,
      percent: Math.round((s.score / s.max_score) * 100),
      answers: s.answers,
      submittedAt: s.created_at
    }));
  } catch (e) {
    console.error('Помилка завантаження результатів сесії:', e);
    return [];
  }
}

// ============ СТРІЧКА (ПОСТИ) ============

export async function createPostInDb(classId: string, post: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('class_posts').insert({
      id: post.id,
      class_id: classId,
      kind: post.kind,
      text: post.text,
      assignment_id: post.assignmentId,
      created_at: post.createdAt
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка створення поста:', e);
    return false;
  }
}

export async function deletePostFromDb(postId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('class_posts').delete().eq('id', postId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('Помилка видалення поста:', e);
    return false;
  }
}