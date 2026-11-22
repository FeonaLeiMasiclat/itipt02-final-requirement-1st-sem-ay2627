USE headquarters_library;

ALTER TABLE borrow_requests
    MODIFY COLUMN status ENUM('Pending', 'Approved', 'Declined', 'Returned', 'Return Pending')
        NOT NULL DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS return_requested_at DATETIME AFTER approved_at;
