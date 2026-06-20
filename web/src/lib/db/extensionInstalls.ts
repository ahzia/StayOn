import { createServiceClient } from '@/lib/supabase/server';
import { isValidExtensionUserId } from '@/lib/storage';

export async function ensureExtensionInstall(extensionUserId: string): Promise<void> {
  if (!isValidExtensionUserId(extensionUserId)) {
    throw new Error(`Invalid extension user id (expected UUID): ${extensionUserId}`);
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { error } = await supabase.from('extension_installs').upsert(
    {
      id: extensionUserId,
      editor: 'cursor',
      last_seen_at: now,
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(`extension_installs upsert failed: ${error.message}`);
  }
}
