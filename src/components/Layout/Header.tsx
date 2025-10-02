import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import CreateTicketModal from '../CreateTicketModal/CreateTicketModal';
import logoImage from '../../assets/logo.webp';
import ApiService from '../../services/api';
import './Header.css';

interface HeaderProps {
  onLogout?: () => void;
  onCreateTicket?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, onCreateTicket }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Debug showLogoutConfirm state changes
  useEffect(() => {
    console.log('showLogoutConfirm state changed to:', showLogoutConfirm);
  }, [showLogoutConfirm]);

  // Initialize with user data from localStorage if available
  const getInitialUserName = () => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.name || user.username || user.user_name || user.displayName || user.firstName || user.email || 'Admin';
      }
    } catch (error) {
      console.error('Error reading initial user data:', error);
    }
    return 'Admin';
  };

  const [userName, setUserName] = useState<string>(getInitialUserName());
  const userMenuRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const userMenuButton = userMenuRef.current;
      const userDropdown = document.querySelector('.user-dropdown');
      
      // Don't close if clicking on user menu button or dropdown
      if (userMenuButton && userMenuButton.contains(target)) {
        return;
      }
      
      if (userDropdown && userDropdown.contains(target)) {
        return;
      }
      
      // Close the menu if clicking outside both button and dropdown
      setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ensure user name is set correctly on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const name = user.name || user.username || user.user_name || user.displayName || user.firstName || user.email || 'Admin';
        if (name !== userName) {
          setUserName(name);
        }
      } catch (error) {
        console.error('Error parsing user data on mount:', error);
      }
    }
  }, []);

  // Get user name from localStorage
  useEffect(() => {
    const getUserName = () => {
      try {
        const userData = localStorage.getItem('userData');
        
        if (userData) {
          const user = JSON.parse(userData);
          
          const name = user.name || 
                      user.username || 
                      user.user_name || 
                      user.displayName ||
                      user.firstName ||
                      user.email || 
                      'Admin';
          setUserName(name);
        } else {
          setUserName('Admin');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserName('Admin');
      }
    };

    getUserName();
    
    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userData') {
        getUserName();
      }
    };
    
    // Listen for custom user data update event
    const handleUserDataUpdate = () => {
      getUserName();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  const handleLogoutClick = () => {
    console.log('handleLogoutClick called');
    setShowUserMenu(false); // Close user menu when showing confirmation
    console.log('Setting showLogoutConfirm to true');
    setShowLogoutConfirm(true);
    console.log('showLogoutConfirm should now be true');
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    try {
      await ApiService.logout();
      // Dispatch custom event to notify App component
      window.dispatchEvent(new CustomEvent('authChange'));
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still proceed with logout even if API call fails
      window.dispatchEvent(new CustomEvent('authChange'));
      if (onLogout) {
        onLogout();
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/dashboard" className="logo">
          <img src={logoImage} alt="Logo" className="logo-image" />
        </Link>

        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          <button 
            className="create-ticket-btn" 
            onClick={() => onCreateTicket ? onCreateTicket() : setShowCreateModal(true)}
            title="Create New Ticket"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Create Ticket
          </button>

          {/* Test button to force show modal */}
          <button 
            onClick={() => {
              console.log('Test button clicked, setting showLogoutConfirm to true');
              setShowLogoutConfirm(true);
            }}
            style={{
              background: 'red',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              marginLeft: '10px',
              cursor: 'pointer'
            }}
          >
            TEST MODAL
          </button>


          <div className="user-menu">
            <button
              ref={userMenuRef}
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-greeting">Hi, {userName}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>

            {showUserMenu && createPortal(
              <div 
                className="user-dropdown"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <Link to="/profile" className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  My Profile
                </Link>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogoutClick();
                  }}
                  className="dropdown-item logout"
                  disabled={isLoggingOut}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          width: '100vw',
          height: '100vh'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px auto',
                background: '#f8f9fa',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                Sign Out Confirmation
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6c757d' }}>
                Are you sure you want to log out? Click 'Yes' to confirm or 'No' to stay logged in.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleLogoutCancel}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: '1px solid #e9ecef',
                  background: '#f8f9fa',
                  color: '#6c757d',
                  minWidth: '100px'
                }}
              >
                No, Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: '1px solid #20c997',
                  background: '#20c997',
                  color: 'white',
                  minWidth: '100px'
                }}
              >
                Yes, I'm sure
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
    </header>
  );
};

export default Header;
