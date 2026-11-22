USE headquarters_library;

-- Retain IDs used by the original frontend catalog and its saved wishlist and cart.
INSERT INTO books
    (id, catalog_order, title, author, genre, copies, price, rating, reviews, synopsis, last_updated, isbn, source_url)
VALUES
    (2000001, 1, 'His Unwritten Promise', 'Cy Caleb Reid', 'Romance', 8, 350, 4.8, 120, 'A profoundly moving and elegant reimagining of a much-loved classic.', '2026-11-21', NULL, NULL),
    (2000002, 2, 'Dear Future Ex', 'Sky Mel Kordy', 'Romance', 6, 320, 4.6, 87, 'Between the lines and their share a library of infinite second chances.', '2026-11-21', NULL, NULL),
    (2000003, 3, 'How Great Books Go', 'Gabriella Smith', 'Comedy', 5, 360, 4.3, 54, 'A new title available for your library.', '2026-11-21', NULL, NULL),
    (2000004, 4, 'The Midnight Library', 'Matt Haig', 'Sci-fi', 7, 390, 4.9, 143, 'A story about the choices that shape a life.', '2026-11-21', NULL, NULL),
    (2000005, 5, 'The House Beyond the Fog', 'Mara Ellery', 'Horror', 4, 340, 4.5, 68, 'A chilling story about the secrets waiting inside an abandoned house.', '2026-11-21', NULL, NULL),
    (2000006, 6, 'The Last Olympian', 'R. J. Calloway', 'Mythology', 9, 410, 4.7, 101, 'A young hero faces ancient gods and a prophecy that could change everything.', '2026-11-21', NULL, NULL),
    (1, 7, 'The Great Gatsby', 'F. Scott Fitzgerald', 'Romance', 10, 350, 4.8, 120, 'A young dreamer enters the glittering world of the Jazz Age, where ambition, love, and the past collide.', '2026-11-21', NULL, NULL),
    (2, 8, 'To Kill a Mockingbird', 'Harper Lee', 'Romance', 10, 420, 4.9, 150, 'In a small Southern town, a family and their neighbors confront prejudice, justice, and compassion.', '2026-11-21', NULL, NULL),
    (3, 9, 'Pride and Prejudice', 'Jane Austen', 'Romance', 10, 300, 4.7, 95, 'Elizabeth Bennet and Mr. Darcy challenge first impressions as they discover affection and understanding.', '2026-11-21', NULL, NULL),
    (4, 10, 'The Hobbit', 'J.R.R. Tolkien', 'Mythology', 10, 450, 4.9, 180, 'A reluctant hero leaves the Shire on a perilous journey through a world of legendary creatures.', '2026-11-21', NULL, NULL),
    (5, 11, 'The Alchemist', 'Paulo Coelho', 'Mythology', 10, 380, 4.6, 110, 'A shepherd follows a recurring dream across the desert in search of a treasure and greater purpose.', '2026-11-21', NULL, NULL),
    (6, 12, 'Little Women', 'Louisa May Alcott', 'Romance', 10, 320, 4.8, 88, 'Four sisters grow up together, finding their own paths through family, friendship, and change.', '2026-11-21', NULL, NULL),
    (7, 13, '1984', 'George Orwell', 'Sci-fi', 10, 390, 4.7, 130, 'In a tightly controlled future, Winston Smith begins to question the world built around him.', '2026-11-21', NULL, NULL),
    (8, 14, 'The Catcher in the Rye', 'J.D. Salinger', 'Comedy', 10, 360, 4.5, 76, 'A sharp, funny account of a restless teenager navigating school, family, and growing up.', '2026-11-21', NULL, NULL),
    (3000001, 15, 'The Rain in España', 'Gwy Saludes', 'Romance', 12, 350, 0, 0, 'A romantic story of friendship, personal growth, and young love.', '2026-10-25', NULL, NULL),
    (3000002, 16, 'Frankenstein', 'Mary Shelley', 'Horror', 6, 320, 0, 0, 'A scientist brings a creature to life and struggles to take responsibility for what follows.', UTC_DATE(), '9780141439471', 'https://openlibrary.org/books/OL3701481M/Frankenstein'),
    (3000003, 17, 'A Wrinkle in Time', 'Madeleine L''Engle', 'Sci-fi', 7, 350, 0, 0, 'Meg journeys through space and time with her brother and a friend to search for her missing father.', UTC_DATE(), '9780440498056', 'https://openlibrary.org/books/OL7522145M/A_Wrinkle_in_Time'),
    (3000004, 18, 'The Importance of Being Earnest', 'Oscar Wilde', 'Comedy', 5, 290, 0, 0, 'Two men use invented identities to avoid obligations, complicating their romances and friendships.', UTC_DATE(), '0486264785', 'https://openlibrary.org/books/OL1876051M/The_importance_of_being_earnest')
ON DUPLICATE KEY UPDATE id = VALUES(id);
