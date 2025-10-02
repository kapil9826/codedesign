// ATTACHMENT-SPECIFIC API FUNCTIONS
// This handles file uploads and attachments for tickets

const API_BASE_URL = 'https://portal.bluemiledigital.in/apis';

// Get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Get user name
const getUserName = (): string => {
  return localStorage.getItem('userName') || 'User';
};

// Check if online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 30000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// UPLOAD ATTACHMENTS TO TICKET
export const uploadTicketAttachments = async (ticketId: string, files: File[]) => {
  console.log('📎 ===== UPLOAD TICKET ATTACHMENTS =====');
  console.log('🔍 Input:', { 
    ticketId, 
    fileCount: files.length,
    fileNames: files.map(f => f.name),
    fileSizes: files.map(f => f.size)
  });
  
  try {
    if (!isOnline()) {
      return { success: false, error: 'No internet connection' };
    }

    if (!files || files.length === 0) {
      return { success: false, error: 'No files to upload' };
    }

    // Get database ID
    let databaseId = ticketId;
    if (!/^\d+$/.test(String(ticketId))) {
      const match = ticketId.match(/\d+/);
      if (match) {
        databaseId = match[0];
        console.log('🔢 Using extracted numeric ID:', databaseId);
      } else {
        return { success: false, error: 'Invalid ticket ID format' };
      }
    }
    
    console.log('🔢 Using database ID for attachments:', databaseId);
    
    // Try multiple endpoints for file upload
    const endpoints = [
      `${API_BASE_URL}/upload-ticket-attachments`,
      `${API_BASE_URL}/ticket-attachments`,
      `${API_BASE_URL}/upload-attachments`,
      `${API_BASE_URL}/add-ticket-files`,
      `${API_BASE_URL}/ticket-files`,
      `${API_BASE_URL}/upload-files`,
      `${API_BASE_URL}/add-ticket-note` // Fallback to note endpoint
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying upload endpoint: ${endpoint}`);
        
        const formData = new FormData();
        formData.append('support_tickets_id', String(databaseId));
        formData.append('ticket_id', String(databaseId));
        formData.append('user_name', getUserName());
        
        // Add files with different field names
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
          formData.append(`attachment_${index}`, file);
          formData.append(`document_${index}`, file);
          formData.append(`upload_${index}`, file);
        });
        
        // Add a dummy note if using the note endpoint
        if (endpoint.includes('note')) {
          formData.append('note', 'File attachment');
          formData.append('comment', 'File attachment');
          formData.append('message', 'File attachment');
        }
        
        console.log('📤 Uploading files to:', endpoint);
        
        const response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: formData
        }, 30000);
        
        console.log(`📡 Upload response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ Files uploaded successfully via ${endpoint}:`, responseData);
          return { success: true, data: responseData, endpoint };
        } else {
          const errorText = await response.text();
          console.log(`❌ Upload failed with ${endpoint}:`, errorText);
        }
      } catch (error) {
        console.log(`❌ Error uploading to ${endpoint}:`, error);
      }
    }
    
    console.log('❌ All upload endpoints failed');
    return { success: false, error: 'Failed to upload attachments - all endpoints failed' };
    
  } catch (error) {
    console.error('❌ Error uploading attachments:', error);
    return { success: false, error: 'Failed to upload attachments' };
  }
};

// ADD COMMENT WITH ATTACHMENTS (SEPARATE STEPS)
export const addCommentWithAttachments = async (ticketId: string, comment: string, files: File[]) => {
  console.log('💬 ===== ADD COMMENT WITH ATTACHMENTS =====');
  console.log('🔍 Input:', { 
    ticketId, 
    comment: comment.substring(0, 50) + '...',
    fileCount: files.length,
    fileNames: files.map(f => f.name)
  });
  
  try {
    // Step 1: Add the comment first
    const commentResult = await addTicketNoteSimple(ticketId, comment, []);
    
    if (!commentResult.success) {
      console.log('❌ Failed to add comment, skipping attachments');
      return commentResult;
    }
    
    console.log('✅ Comment added successfully, now uploading attachments...');
    
    // Step 2: Upload attachments separately
    if (files && files.length > 0) {
      const uploadResult = await uploadTicketAttachments(ticketId, files);
      
      if (uploadResult.success) {
        console.log('✅ Both comment and attachments added successfully');
        return { success: true, data: { comment: commentResult.data, attachments: uploadResult.data } };
      } else {
        console.log('⚠️ Comment added but attachments failed:', uploadResult.error);
        return { success: true, data: commentResult.data, warning: 'Comment added but attachments failed to upload' };
      }
    } else {
      console.log('✅ Comment added successfully (no attachments)');
      return commentResult;
    }
    
  } catch (error) {
    console.error('❌ Error adding comment with attachments:', error);
    return { success: false, error: 'Failed to add comment with attachments' };
  }
};

// Import the simple note function
import { addTicketNoteSimple } from './api-simple-note';

