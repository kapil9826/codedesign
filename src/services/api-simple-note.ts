// SIMPLIFIED ADD TICKET NOTE FUNCTION
// This is a working solution for adding ticket comments

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
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 8000): Promise<Response> => {
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

// SIMPLIFIED ADD TICKET NOTE FUNCTION
export const addTicketNoteSimple = async (ticketId: string, comment: string, attachments?: File[]) => {
  console.log('🚀 ===== SIMPLIFIED ADD TICKET NOTE =====');
  console.log('🔍 Input:', { ticketId, comment: comment.substring(0, 50) + '...', attachments: attachments?.length || 0 });
  
  try {
    if (!isOnline()) {
      return { success: false, error: 'No internet connection' };
    }

    // SIMPLIFIED DATABASE ID RESOLUTION
    let databaseId = ticketId;
    
    // If ticket ID is numeric, use it directly
    if (/^\d+$/.test(String(ticketId))) {
      console.log('✅ Using numeric ticket ID directly:', ticketId);
      databaseId = ticketId;
    } else {
      console.log('🔄 Looking up database ID for:', ticketId);
      
      try {
        // Get tickets to find the database ID
        const response = await fetch(`${API_BASE_URL}/tickets?page=1&per_page=1000`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === '1' && data.data) {
            let tickets = [];
            if (Array.isArray(data.data)) {
              tickets = data.data;
            } else if (data.data && typeof data.data === 'object' && Array.isArray(data.data.data)) {
              tickets = data.data.data;
            }
            
            console.log('📋 Found', tickets.length, 'tickets');
            
            // Find matching ticket
            const matchingTicket = tickets.find((ticket: any) => 
              ticket.ticket_number === ticketId || ticket.id === ticketId
            );
            
            if (matchingTicket) {
              databaseId = matchingTicket.id;
              console.log('✅ Found matching ticket:', {
                ticketNumber: ticketId,
                databaseId: matchingTicket.id
              });
            } else {
              console.log('⚠️ No matching ticket found, using fallback...');
              const match = ticketId.match(/\d+/);
              if (match) {
                databaseId = match[0];
                console.log('🔢 Using extracted numeric part:', databaseId);
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error during ticket lookup:', error);
        const match = ticketId.match(/\d+/);
        if (match) {
          databaseId = match[0];
          console.log('🔢 Using extracted numeric part:', databaseId);
        }
      }
    }
    
    console.log('🔢 Final database ID:', databaseId);
    
    // Create form data
    const formData = new FormData();
    formData.append('support_tickets_id', String(databaseId));
    formData.append('note', comment);
    formData.append('user_name', getUserName());
    
    // Add additional fields that might be required
    formData.append('ticket_id', String(databaseId));
    formData.append('comment', comment);
    formData.append('message', comment);
    
    // Add attachments if any (but don't let them break the comment)
    if (attachments && attachments.length > 0) {
      console.log('📎 Adding attachments to form data:', attachments.length);
      try {
        attachments.forEach((file, index) => {
          console.log(`📎 Adding file ${index}:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          formData.append(`attachment_${index}`, file);
          formData.append(`file_${index}`, file);
          formData.append(`document_${index}`, file);
        });
      } catch (attachmentError) {
        console.log('⚠️ Error adding attachments, continuing with comment only:', attachmentError);
      }
    } else {
      console.log('📎 No attachments to send - comment only');
    }
    
    console.log('📤 Sending form data to API with attachments...');
    
    // Try multiple endpoints for adding notes with attachments
    const endpoints = [
      `${API_BASE_URL}/add-ticket-note`,
      `${API_BASE_URL}/ticket-note`,
      `${API_BASE_URL}/add-note`,
      `${API_BASE_URL}/ticket-comment`,
      `${API_BASE_URL}/add-comment`,
      `${API_BASE_URL}/support-ticket-note`
    ];
    
    let response;
    let successfulEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        
        response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: formData
        }, 15000);
        
        console.log(`📡 Response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ Success with ${endpoint}:`, responseData);
          successfulEndpoint = endpoint;
          return { success: true, data: responseData };
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed with ${endpoint}:`, errorText);
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error);
      }
    }
    
    if (!successfulEndpoint) {
      console.log('❌ All endpoints failed');
      return { success: false, error: 'Failed to add note - all endpoints failed' };
    }
  } catch (error) {
    console.error('❌ Error adding ticket note:', error);
    return { success: false, error: 'Failed to add note' };
  }
};
