import { createClient } from "@supabase/supabase-js";

// Initializing Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(file) {
  const { data, error } = await supabase.storage
    .from("Files") // Name of your bucket
    .upload(`user-${userId}/${file.name}`, file);

  if (error) {
    console.error("Error uploading file:", error);
    return null;
  }

  // Get the public URL of the uploaded file
  const publicUrl = supabase.storage
    .from("files")
    .getPublicUrl(`user-${userId}/${file.name}`);

  console.log("File uploaded successfully:", publicUrl.publicURL);
  return publicUrl.publicURL; // Return the file URL
}
