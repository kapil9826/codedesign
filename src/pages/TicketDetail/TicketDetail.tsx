import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ApiService from '../../services/api';
import { Ticket, Comment } from '../../types';
import './TicketDetail.css';

const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketError, setTicketError] = useState('');
  const [isUploadingComment, setIsUploadingComment] = useState(false);
  const [showCommentSuccess, setShowCommentSuccess] = useState(false);

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
            issue: ticket.title || 'No title',
            description: ticket.description || 'No description',
            status: ticket.status_name || 'Active',
            priority: ticket.priority_name || 'Medium',
            requester: ticket.user_name || 'Unknown User',
            createdAt: ticket.created_at || new Date().toISOString(),
            status_name: ticket.status_name,
            status_bg_color: ticket.status_bg_color,
            status_text_color: ticket.status_text_color,
            priority_name: ticket.priority_name,
            priority_bg_color: ticket.priority_bg_color,
            priority_text_color: ticket.priority_text_color
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
      
      // Find ticket in current list
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
          const transformedTicket: Ticket = {
            id: matchingTicket.ticket_number || matchingTicket.id,
            issue: matchingTicket.title || 'No title',
            description: matchingTicket.description || 'No description',
            status: matchingTicket.status_name || 'Active',
            priority: matchingTicket.priority_name || 'Medium',
            requester: matchingTicket.user_name || 'Unknown User',
            createdAt: matchingTicket.created_at || new Date().toISOString(),
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
      <div className="ticket-detail-sidebar">
        <div className="sidebar-header">
          <h3>Recent Tickets</h3>
        </div>
        
        {error && (
          <div className="sidebar-error">
            <p>{error}</p>
            <button onClick={fetchTickets}>Retry</button>
          </div>
        )}
        
        <div className="sidebar-tickets">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`sidebar-ticket-item ${currentTicket?.id === ticket.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentTicket(ticket);
                loadComments();
              }}
            >
              <div className="sidebar-ticket-issue">{ticket.issue}</div>
              <div className="sidebar-ticket-meta">
                <span className={`sidebar-ticket-status ${ticket.status?.toLowerCase()}`}>
                  {ticket.status}
                </span>
                <span className={`sidebar-ticket-priority ${ticket.priority?.toLowerCase()}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ticket-detail-main">
        {ticketLoading && <div className="loading">Loading ticket details...</div>}
        
        {ticketError && (
          <div className="ticket-error">
            <p>⚠️ {ticketError}</p>
            <button onClick={() => fetchTicketDetails(ticketId!)}>Retry</button>
          </div>
        )}
        
        {currentTicket && (
          <>
            <div className="ticket-header">
              <h1>{currentTicket.issue}</h1>
              <div className="ticket-meta">
                <span className={`ticket-status ${currentTicket.status?.toLowerCase()}`}>
                  {currentTicket.status}
                </span>
                <span className={`ticket-priority ${currentTicket.priority?.toLowerCase()}`}>
                  {currentTicket.priority}
                </span>
              </div>
            </div>
            
            <div className="ticket-description">
              <h3>Description</h3>
              <p>{currentTicket.description}</p>
            </div>
            
            <div className="ticket-comments">
              <h3>Comments</h3>
              
              {showCommentSuccess && (
                <div className="comment-success">
                  ✅ Comment added successfully!
                </div>
              )}
              
              <div className="add-comment">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  rows={3}
                />
                
                <div className="comment-actions">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    📎 Attach Files
                  </label>
                  
                  <button
                    onClick={handleAddComment}
                    disabled={isUploadingComment}
                    style={{
                      backgroundColor: 'rgb(3, 92, 98)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      cursor: isUploadingComment ? 'not-allowed' : 'pointer',
                      opacity: isUploadingComment ? 0.6 : 1
                    }}
                  >
                    {isUploadingComment ? 'Adding...' : '→'}
                  </button>
                </div>
              </div>
              
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author}</span>
                      <span className="comment-time">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="comment-message">{comment.message}</div>
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="comment-attachments">
                        {comment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            📎 {attachment.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
