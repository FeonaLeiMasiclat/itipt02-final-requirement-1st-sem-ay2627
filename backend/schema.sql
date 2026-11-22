CREATE DATABASE IF NOT EXISTS headquarters_library
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE headquarters_library;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE,
    email VARCHAR(254) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('reader', 'admin') NOT NULL DEFAULT 'reader',
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    address VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_have_login CHECK (username IS NOT NULL OR email IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_resets (
    user_id BIGINT UNSIGNED PRIMARY KEY,
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(32) NOT NULL,
    copies INT UNSIGNED NOT NULL DEFAULT 0,
    price DECIMAL(10, 2) UNSIGNED NOT NULL,
    rating DECIMAL(3, 2) UNSIGNED NOT NULL DEFAULT 0,
    reviews INT UNSIGNED NOT NULL DEFAULT 0,
    synopsis TEXT NOT NULL,
    status ENUM('Active', 'Archived') NOT NULL DEFAULT 'Active',
    last_updated DATE NOT NULL DEFAULT (UTC_DATE()),
    isbn VARCHAR(13),
    source_url VARCHAR(255),
    catalog_order SMALLINT UNSIGNED,
    CONSTRAINT books_valid_rating CHECK (rating <= 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS borrow_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED,
    book_title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    kind ENUM('Borrow', 'Acquisition') NOT NULL DEFAULT 'Borrow',
    status ENUM('Pending', 'Approved', 'Declined', 'Returned', 'Return Pending') NOT NULL DEFAULT 'Pending',
    requested_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    approved_at DATETIME,
    return_requested_at DATETIME,
    returned_at DATETIME,
    INDEX borrow_reader_book (user_id, book_id, status),
    INDEX borrow_book_status (book_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT cart_has_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlist_items (
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shop_orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    total DECIMAL(24, 2) UNSIGNED NOT NULL,
    placed_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    UNIQUE KEY shop_orders_request (user_id, request_key),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shop_order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL,
    CONSTRAINT order_item_has_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;
