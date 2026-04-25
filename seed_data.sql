INSERT INTO words (word, definition, language) VALUES
('Ephemeral', 'Lasting for a very short time', 'English'),
('Serendipity', 'The occurrence of fortunate discoveries by accident', 'English'),
('Wanderlust', 'A strong desire to travel and explore the world', 'German'),
('Schadenfreude', 'Pleasure derived from another person''s misfortune', 'German'),
('Saudade', 'A deep emotional state of nostalgic longing', 'Portuguese');

INSERT INTO reviews (word_id, score, interval, easiness_factor, repetition, next_review) VALUES
(1, 4, 6, 2.5, 2, datetime('now', '+6 days')),
(2, 2, 1, 1.8, 1, datetime('now', '+1 day')),
(3, 5, 10, 2.8, 3, datetime('now', '+10 days'));