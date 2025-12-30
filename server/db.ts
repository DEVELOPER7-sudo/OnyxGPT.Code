
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const getProjects = async () => {
  const { data, error } = await supabase.from('projects').select('id');
  if (error) throw error;
  return data;
};

export const createProject = async (projectName: string) => {
  const projectId = uuidv4();
  const { data, error } = await supabase.from('projects').insert([{ id: projectId, name: projectName }]).select();
  if (error) throw error;
  return data[0];
};

export const deleteProject = async (projectId: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
};

export const updateFile = async (projectId: string, filePath: string, content: string) => {
    const { data, error } = await supabase.storage.from('project-files').upload(`${projectId}/${filePath}`, content, { upsert: true });
    if (error) throw error;
};
  
export const deleteFile = async (projectId: string, filePath: string) => {
    const { data, error } = await supabase.storage.from('project-files').remove([`${projectId}/${filePath}`]);
    if (error) throw error;
};

export const renameFile = async (projectId: string, oldPath: string, newPath: string) => {
    const { data, error } = await supabase.storage.from('project-files').move(`${projectId}/${oldPath}`, `${projectId}/${newPath}`);
    if (error) throw error;
};
