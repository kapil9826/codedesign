import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CgAttachment } from "react-icons/cg";
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import CommentLoader from '../../components/CommentLoader/CommentLoader';
import CommentSuccess from '../../components/CommentSuccess/CommentSuccess';
import ApiService from '../../services/api';
import { addTicketNoteSimple } from '../../services/api-simple-note';
import { addCommentWithAttachments } from '../../services/api-attachments';
import './TicketDetail.css';

interface Ticket {
  id: string;
  requester: string;
  issue: string;
  time: string;
  badge?: number;
  status: 'Active' | 'Closed' | 'On-hold' | 'Overdue' | 'Assigned' | 'Suspend';
  priority: 'Low' | 'Medium' | 'High';
  priority_name?: string;
  priority_bg_color?: string;
  priority_text_color?: string;
  status_name?: string;
  status_bg_color?: string;
  status_text_color?: string;
}

interface Comment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAgent: boolean;
  avatar?: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

interface TicketDetailProps {
  ticketId: string;
  onClose: () => void;
  onTicketChange: (ticketId: string) => void;
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onClose, onTicketChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newComment, setNewComment] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingComment, setIsUploadingComment] = useState(false);
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);

  // Simple fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await ApiService.getTickets();
      
      if (result.success && result.data && result.data.data) {
        let apiTickets = [];
        if (Array.isArray(result.data.data)) {
          apiTickets = result.data.data;
        } else if (result.data.data && typeof result.data.data === 'object' && Array.isArray(result.data.data.data)) {
          apiTickets = result.data.data.data;
        }
        
        if (apiTickets.length > 0) {
          const transformedTickets: Ticket[] = apiTickets.map((ticket: any) => ({
            id: ticket.ticket_number || ticket.id,
            requester: ticket.user_name || 'Unknown',
            issue: ticket.title || 'No description',
            time: ticket.created_at || new Date().toLocaleTimeString(),
            status: ticket.status_name || ticket.status || 'Null',
            priority: ticket.priority_name || ticket.priority || 'Null',
            priority_name: ticket.priority_name || ticket.priority_name,
            priority_bg_color: ticket.priority_bg_color,
            priority_text_color: ticket.priority_text_color,
            status_name: ticket.status_name,
            status_bg_color: ticket.status_bg_color,
            status_text_color: ticket.status_text_color,
            badge: 0,
            description: ticket.description || 'No description available',
            attachments: ticket.documents ? ticket.documents.length : 0,
            createdAt: ticket.created_at || new Date().toLocaleDateString()
          }));
          setTickets(transformedTickets);
        } else {
          setTickets([]);
        }
      } else {
        setError(result.error || 'Failed to fetch tickets');
        setTickets([]);
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      setError('Failed to fetch tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Simple fetch ticket details
  const fetchTicketDetails = useCallback(async (ticketId: string) => {
    try {
      setTicketLoading(true);
      setTicketError('');
      
      // Find ticket in current list first
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setCurrentTicket(ticket);
        setTicketLoading(false);
        return;
      }
      
      // If not found, try API
      const result = await ApiService.getTickets();
      if (result.success && result.data && result.data.data) {
        let apiTickets = [];
        if (Array.isArray(result.data.data)) {
          apiTickets = result.data.data;
        } else if (result.data.data && typeof result.data.data === 'object' && Array.isArray(result.data.data.data)) {
          apiTickets = result.data.data.data;
        }
        
        const matchingTicket = apiTickets.find((t: any) => t.ticket_number === ticketId || t.id === ticketId);
        if (matchingTicket) {
          const transformedTicket = {
            id: matchingTicket.ticket_number || matchingTicket.id || ticketId,
            title: matchingTicket.title || 'No title',
            description: matchingTicket.description || 'No description available',
            status: matchingTicket.status_name || matchingTicket.status || 'Active',
            priority: matchingTicket.priority_name || matchingTicket.priority || 'Medium',
            userName: matchingTicket.user_name || 'Unknown User',
            userEmail: matchingTicket.user_email || 'unknown@example.com',
            userPhone: matchingTicket.user_phone || 'N/A',
            createdAt: matchingTicket.created_at || new Date().toISOString(),
            updatedAt: matchingTicket.updated_at || new Date().toISOString(),
            assignedTo: matchingTicket.assigned_to || 'Unassigned',
            department: matchingTicket.department || 'General',
            category: matchingTicket.category || 'General',
            documents: matchingTicket.documents || [],
            notes: matchingTicket.notes || [],
            status_name: matchingTicket.status_name,
            status_bg_color: matchingTicket.status_bg_color,
            status_text_color: matchingTicket.status_text_color,
            priority_name: matchingTicket.priority_name,
            priority_bg_color: matchingTicket.priority_bg_color,
            priority_text_color: matchingTicket.priority_text_color
          };
          setCurrentTicket(transformedTicket);
        } else {
          setTicketError('Ticket not found');
        }
      } else {
        setTicketError('Failed to load ticket');
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      setTicketError('Network error. Please check your connection.');
    } finally {
      setTicketLoading(false);
    }
  }, [tickets]);

  // Load comments from localStorage
  const loadComments = useCallback(() => {
    if (ticketId) {
      try {
        const localComments = JSON.parse(localStorage.getItem('localComments') || '{}');
        if (localComments[ticketId] && Array.isArray(localComments[ticketId])) {
          setComments(localComments[ticketId]);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Could not load comments:', error);
        setComments([]);
      }
    }
  }, [ticketId]);

  // Add comment
  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() && selectedFiles.length === 0) {
      alert('Please enter a comment or select a file to attach.');
      return;
    }
    
    try {
      setIsUploadingComment(true);
      
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        author: 'You',
        message: newComment,
        timestamp: new Date().toISOString(),
        isAgent: false,
        attachments: selectedFiles.map((file, index) => ({
          id: `attachment-${Date.now()}-${index}`,
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)}KB`,
          type: file.type,
          url: URL.createObjectURL(file)
        }))
      };
      
      // Add to state
      setComments(prev => [...prev, newCommentObj]);
      
      // Save to localStorage
      if (ticketId) {
        try {
          const localComments = JSON.parse(localStorage.getItem('localComments') || '{}');
          if (!localComments[ticketId]) {
            localComments[ticketId] = [];
          }
          localComments[ticketId].push(newCommentObj);
          localStorage.setItem('localComments', JSON.stringify(localComments));
        } catch (error) {
          console.error('Could not save comment:', error);
        }
      }
      
      setNewComment('');
      setSelectedFiles([]);
      setShowCommentSuccess(true);
      setTimeout(() => setShowCommentSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setIsUploadingComment(false);
    }
  }, [newComment, selectedFiles, ticketId]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Memoized status options
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Status' },
    ...statuses.map((status: any) => ({
      value: status.name,
      label: status.name
    }))
  ], [statuses]);

  // Memoized priority options
  const priorityOptions = useMemo(() => [
    { value: 'all', label: 'All Priority' },
    ...priorities.map((priority: any) => ({
      value: priority.name,
      label: priority.name
    }))
  ], [priorities]);

  // Memoized styling functions
  const getStatusStyling = useCallback((ticket: any) => {
    return {
      backgroundColor: ticket.status_bg_color || '#e2e8f0',
      color: ticket.status_text_color || '#4a5568'
    };
  }, []);

  const getPriorityStyling = useCallback((ticket: any) => {
    return {
      backgroundColor: ticket.priority_bg_color || '#e2e8f0',
      color: ticket.priority_text_color || '#4a5568'
    };
  }, []);

  // Memoized filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.priority.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (ticket as any).status_name === statusFilter;
      const matchesPriority = priorityFilter === 'all' || (ticket as any).priority_name === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  // Initial load
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load ticket details when ticketId changes
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails(ticketId);
      loadComments();
    }
  }, [ticketId, fetchTicketDetails, loadComments]);

  // Listen for ticket creation events
  useEffect(() => {
    const handleTicketCreated = () => {
      fetchTickets();
    };

    window.addEventListener('ticketCreated', handleTicketCreated);
    return () => window.removeEventListener('ticketCreated', handleTicketCreated);
  }, [fetchTickets]);

  if (loading) {
    return (
      <div className="ticket-detail-container">
        <div className="loading">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-container">
      {/* Ticket List Sidebar - Left */}
      <div className="ticket-list-sidebar">
        <div className="sidebar-header">
          <button className="back-btn" onClick={onClose}>←</button>
          <input
            type="text"
            placeholder="Search tickets..."
            className="sidebar-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sidebar-filter">
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="priority-dropdown"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sidebar-filter">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-dropdown"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sidebar-tickets">
          {loading && (
            <div className="sidebar-loading">
              <SkeletonLoader type="sidebar-ticket" count={3} />
            </div>
          )}
          
          {error && (
            <div className="sidebar-error">
              <p>⚠️ {error}</p>
              <button onClick={fetchTickets}>Retry</button>
            </div>
          )}
          
          {!loading && !error && filteredTickets.length === 0 && tickets.length > 0 && (
            <div className="sidebar-no-tickets">
              <div className="sidebar-no-records-icon">🔍</div>
              <h4>No records found</h4>
              <p>No tickets match your current search or filter criteria.</p>
            </div>
          )}
          
          {!loading && !error && tickets.length === 0 && (
            <div className="sidebar-no-tickets">
              <p>No tickets found</p>
              <button onClick={fetchTickets}>Retry</button>
            </div>
          )}
          
          {!loading && !error && filteredTickets.map((ticket) => (
            <div 
              key={ticket.id} 
              className={`sidebar-ticket-item ${ticket.id === ticketId ? 'active' : ''}`}
              onClick={() => onTicketChange(ticket.id)}
            >
              <div className="sidebar-ticket-id">{ticket.id}</div>
              <div className="sidebar-ticket-issue">{ticket.issue}</div>
              <div className="sidebar-ticket-badges">
                <div 
                  className="sidebar-ticket-priority"
                  style={getPriorityStyling(ticket)}
                >
                  {ticket.priority_name || ticket.priority || 'Null'}
                </div>
                <div 
                  className={`sidebar-ticket-status status-${ticket.status.toLowerCase().replace('-', '')}`}
                  style={getStatusStyling(ticket)}
                >
                  {ticket.status_name || ticket.status || 'Null'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section - Middle */}
      <div className="comments-section">
        <div className="comments-header">
          <h3>Comments</h3>
        </div>

        <div className="comments-list">
          {ticketLoading && comments.length === 0 && (
            <SkeletonLoader type="comment" count={2} />
          )}
          {!ticketLoading && comments.length === 0 && (
            <div className="no-comments">
              <p>No comments yet. Be the first to add a comment!</p>
            </div>
          )}
          {isUploadingComment && (
            <CommentLoader message="Adding your comment..." />
          )}
          {showCommentSuccess && (
            <CommentSuccess onComplete={() => setShowCommentSuccess(false)} />
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="comment-bubble">
                <div className="comment-header">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-timestamp">
                    {new Date(comment.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </div>
                <div className="comment-message">{comment.message}</div>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="comment-attachments">
                    {comment.attachments.map((attachment) => (
                      <div key={attachment.id} className="attachment-item">
                        <span className="attachment-icon"><CgAttachment /></span>
                        <div className="attachment-content">
                          {attachment.url ? (
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              {attachment.name}
                            </a>
                          ) : (
                            <span className="attachment-name">{attachment.name}</span>
                          )}
                          <span className="attachment-size">
                            {attachment.url ? '(Click to view)' : '(No link available)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="add-comment-section">
          <h4>Add Comment</h4>
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              {selectedFiles.map((file, index) => (
                <div key={index} className="selected-file">
                  <span className="file-icon"><CgAttachment /></span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                  <button 
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`comment-form ${isUploadingComment ? 'loading' : ''}`}>
            <textarea
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="comment-textarea"
              rows={1}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
            />
            <div className="comment-actions">
              <div className="formatting-icons">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  id="file-input"
                  accept="*/*"
                />
                <label 
                  htmlFor="file-input" 
                  className="formatting-icon"
                  title="Attach files"
                >
                  <CgAttachment />
                </label>
              </div>
              <button 
                className="add-comment-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddComment();
                }}
                type="button"
                disabled={isUploadingComment}
                title="Send comment"
                style={{
                  backgroundColor: 'rgb(3, 92, 98)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: isUploadingComment ? 'not-allowed' : 'pointer',
                  opacity: isUploadingComment ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                onMouseEnter={(e) => {
                  if (!isUploadingComment) {
                    e.currentTarget.style.backgroundColor = 'rgb(2, 70, 75)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isUploadingComment) {
                    e.currentTarget.style.backgroundColor = 'rgb(3, 92, 98)';
                  }
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Section - Right Side */}
      <div className="ticket-detail-section">
        {ticketLoading && (
          <div className="ticket-loading">
            <SkeletonLoader type="ticket-detail" count={1} />
          </div>
        )}
        
        {ticketError && (
          <div className="ticket-error">
            <p>⚠️ {ticketError}</p>
            <button 
              className="retry-btn" 
              onClick={() => fetchTicketDetails(ticketId)}
            >
              Retry
            </button>
          </div>
        )}
        
        {!ticketLoading && !ticketError && currentTicket && (
          <>
            <div className="ticket-header">
              <div className="ticket-id">#{currentTicket.id}</div>
              <div className="ticket-header-actions">
                <button className="close-btn" onClick={onClose}>×</button>
              </div>
            </div>
            
            <h1 className="ticket-title">{currentTicket.title}</h1>
            
            <div className="ticket-description">
              <p>{currentTicket.description}</p>
            </div>

            <div className="ticket-meta">
              <div className="meta-item">
                <span className="meta-label"> Name</span>
                <span className="meta-value">{currentTicket.userName || 'Unknown User'}</span>
              </div>
              
              <div className="meta-item">
                <span className="meta-label"> Email</span>
                <span className="meta-value">{currentTicket.userEmail || 'No email'}</span>
              </div>
            
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <div className="status-container">
                  <span 
                    className="status-text"
                    style={{
                      ...getStatusStyling(currentTicket),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.55rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {currentTicket.status_name || currentTicket.status}
                  </span>
                </div>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Priority</span>
                <div className="priority-container">
                  <span 
                    className="priority-text"
                    style={{
                      ...getPriorityStyling(currentTicket),
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '0.55rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {currentTicket.priority_name || currentTicket.priority}
                  </span>
                </div>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Created</span>
                <span className="meta-value">
                  {new Date(currentTicket.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="meta-item">
                <span className="meta-label">Last Action</span>
                <span className="meta-value">
                  {new Date(currentTicket.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="ticket-attachments">
              <h3>Attachments ({currentTicket.documents ? currentTicket.documents.length : 0})</h3>
              {currentTicket.documents && currentTicket.documents.length > 0 ? (
                <div className="attachments-list">
                  {currentTicket.documents.map((docUrl: string, index: number) => {
                    const getFileNameFromUrl = (url: string) => {
                      try {
                        const urlPath = new URL(url).pathname;
                        const fileName = urlPath.split('/').pop() || '';
                        const cleanFileName = fileName.replace(/^\d+_/, '');
                        return cleanFileName || `Attachment ${index + 1}`;
                      } catch (error) {
                        return `Attachment ${index + 1}`;
                      }
                    };

                    const fileName = getFileNameFromUrl(docUrl);

                    return (
                      <div key={index} className="attachment-item">
                        <span className="attachment-icon"><CgAttachment /></span>
                        <div className="attachment-content">
                          <a 
                            href={docUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            {fileName}
                          </a>
                          <span className="attachment-size">
                            (Click to view)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-attachments">
                  <p>No attachments found for this ticket.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;