import React from 'react';
import './LogoutConfirmation.css';

interface LogoutConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  console.log('LogoutConfirmation rendered with isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('LogoutConfirmation: isOpen is false, returning null');
    return null;
  }
  
  console.log('LogoutConfirmation: isOpen is true, rendering modal');

  return (
    <div className="logout-modal-overlay">
      <div className="logout-modal">
        <div className="logout-modal-header">
          <div className="logout-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7L7 17M7 7L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 7L17 7L17 17L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="logout-title">Sign Out Confirmation</h2>
        </div>
        
        <div className="logout-modal-body">
          <p className="logout-message">
            Are you sure you want to log out? Click 'Yes' to confirm or 'No' to stay logged in.
          </p>
        </div>
        
        <div className="logout-modal-actions">
          <button 
            className="logout-btn-cancel" 
            onClick={onCancel}
          >
            No, Cancel
          </button>
          <button 
            className="logout-btn-confirm" 
            onClick={onConfirm}
          >
            Yes, I'm sure
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;
