CREATE USER concertchair WITH ENCRYPTED PASSWORD '';

CREATE DATABASE pafe
    WITH TEMPLATE = 'template0'
    OWNER = 'concertchair'
    LOCALE = 'en_US.UTF-8';

 CREATE TYPE instrument_list AS ENUM ('Cello',
                                'Flute',
                                'Piano',
                                'Violin',
                                'Soprano',
                                'Viola',
                                'Tenor',
                                'Clarinet',
                                'Oboe',
                                'Bassoon',
                                'Ensemble');


CREATE TYPE grade_list AS ENUM (
    'Preschool - 2nd',
    'Preschool - 4th',
    'Preschool - 6th',
    'Preschool - 8th',
    '3rd - 4th',
    '3rd - 5th',
    '3rd - 8th',
    '5th - 6th',
    '5th - 8th',
    '6th - 8th',
    '7th - 8th',
    '9th - 10th',
    '9th - 12th',
    '11th - 12th'
);


CREATE TABLE performer (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    grade grade_list,
    email VARCHAR(255) NULL,
    phone VARCHAR(18) NULL,
    instrument instrument_list
);

CREATE TABLE accompanist (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL
);

CREATE TABLE composer (
    id SERIAL PRIMARY KEY,
    printed_name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    years_active VARCHAR(25) NOT NULL,
    alias VARCHAR(255) NULL
);
CREATE INDEX composer_name_idx ON composer(full_name);

CREATE TABLE musical_piece (
    id SERIAL PRIMARY KEY,
    printed_name VARCHAR(512) NOT NULL,
    first_composer_id INTEGER NOT NULL,
    all_movements VARCHAR(512) NULL,
    second_composer_id INTEGER NULL,
    third_composer_id INTEGER NULL
);
CREATE INDEX musical_piece_name_idx ON musical_piece(printed_name);

CREATE TABLE performance_pieces (
    performance_id SERIAL PRIMARY KEY,
    musical_piece_id INTEGER NOT NULL,
    movement VARCHAR(255) NULL
);

CREATE TABLE performer_lottery (
    performer_id INTEGER NOT NULL,
    lottery INTEGER NOT NULL,
    lookup_code CHAR(4) NOT NULL,
    pafe_series INTEGER NOT NULL
);
CREATE UNIQUE INDEX lookup_performer_idx ON performer_lottery(lookup_code);

CREATE TABLE performer_ranked_choice (
    performer_id INTEGER NOT NULL,
    concert_series VARCHAR(255) NOT NULL,
    pafe_series INTEGER NOT NULL,
    first_choice_time TIMESTAMP NOT NULL,
    second_choice_time TIMESTAMP NULL,
    third_choice_time TIMESTAMP NULL,
    fourth_choice_time TIMESTAMP NULL
);
CREATE UNIQUE INDEX lookup_ranked_choice_idx ON performer_ranked_choice(performer_id, concert_series, pafe_series);

CREATE TABLE performance (
    id SERIAL PRIMARY KEY,
    performer_id INTEGER NOT NULL,
    performance_order INTEGER DEFAULT 100 NOT NULL,
    concert_series VARCHAR(255) NOT NULL,
    pafe_series INTEGER NOT NULL,
    duration INTEGER DEFAULT 0 NOT NULL,
    accompanist_id INTEGER NULL,
    concert_time TIMESTAMP NULL,
    instrument instrument_list,
    warm_up_room_name VARCHAR(255) NULL,
    warm_up_room_start TIMESTAMP NULL,
    warm_up_room_end TIMESTAMP NULL
);

INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Adele Adkins','Adele Adkins','1988 - current');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Amy Beach','Amy Beach','1867 - 1944');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Antonín Dvořák','Antonin Dvorak','1841 - 1904');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Antonio Vivaldi','Antonio Vivaldi','1678 - 1741');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Aram Khachaturian','Aram Khachaturian','1903 - 1978');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Bohuslav Martinu','Bohuslav Martinu','1890 - 1959');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Camille Saint-Saëns','Camille Saint-Saens','1835 - 1921');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Carl Böhm','Carl Bohm','1844 - 1920');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Carl Maria von Weber','Carl Maria von Weber','1786 - 1826');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Carl Philipp Stamitz','Carl Philipp Stamitz','1745 - 1801');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Charles Dancla','Charles Dancla','1817 - 1907');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Dan Wilson','Dan Wilson','1961 - current');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Dmitri Shostakovich','Dmitri Shostakovich','1906 - 1975');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Édouard Lalo','Edouard Lalo','1823 - 1892');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Edward Elgar','Edward Elgar','1857 - 1934');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Emile Pessard','Emile Pessard','1843 - 1917');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Frank Wildhorn','Frank Wildhorn','1958 - current');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Franz Joseph Haydn','Franz Joseph Haydn','1732 - 1809');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Franz Liszt','Franz Liszt','1811 - 1886');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Frédéric Chopin','Frederic Chopin','1810 - 1849');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Georg Philipp Telemann','Georg Philipp Telemann','1681 - 1767');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('George Frideric Handel','George Frideric Handel','1685 - 1759');
INSERT INTO composer (printed_name, full_name, years_active, alias) VALUES ('Georges Bizet','Georges Bizet','1838 - 1875','Bizet');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Henri Vieuxtemps','Henri Vieuxtemps','1820 - 1881');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Henryk Wieniawski','Henryk Wieniawski','1835 - 1881');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Irving Berlin','Irving Berlin','1888 - 1989');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Jean Sibelius','Jean Sibelius','1865 - 1957');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Johann Christian Bach','Johann Christian Bach','1735 - 1782');
INSERT INTO composer (printed_name, full_name, years_active, alias) VALUES ('Johann Sebastian Bach','Johann Sebastian Bach','1685 - 1750', 'Johan Sebastian bach');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Maurice Ravel','Maurice Ravel','1875 - 1837');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Max Bruch','Max Bruch','1838 - 1920');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Niccolò Paganini','Niccolo Paganini','1782 - 1840');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Nikolai Kapustin','Nikolai Kapustin','1937 - 2020');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Otar Gordeli','Otar Gordeli','1928 - 1994');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Pablo de Sarasate','Pablo de Sarasate','1844 - 1908');
INSERT INTO composer (printed_name, full_name, years_active, alias) VALUES ('Pyotr Ilyich Tchaikovsky','Pyotr Ilyich Tchaikovsky','1840 - 1893','Tchaikovsky');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Richard Rodgers','Richard Rodgers','1902 - 1979');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Robert Schumann','Robert Schumann','1810 - 1856');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Rossini Niccolò Paganini','Rossini Niccolo Paganini','1782 - 1840');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Sergei Prokofiev','Sergei Prokofiev','1891 - 1953');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('William Gillock','William Gillock','1917 - 1993');
INSERT INTO composer (printed_name, full_name, years_active, alias) VALUES ('William Henry Squire','William Henry Squire','1871 - 1963', 'William H. Squire');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Wolfgang Amadeus Mozart','Wolfgang Amadeus Mozart','1756 - 1791');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Luigi Boccherini','Luigi Boccherini','1745 - 1805');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Gabriel Fauré','Gabriel FaurE','1842 - 1924');
INSERT INTO composer (printed_name, full_name, years_active) VALUES ('Ludwig van Beethoven','Ludwig van Beethoven','1770 - 1827');