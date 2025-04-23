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

CREATE TABLE performer (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    epoch INTEGER NOT NULL,
    archive BOOLEAN NOT NULL DEFAULT FALSE,
    email VARCHAR(255) NULL,
    phone VARCHAR(18) NULL,
    instrument VARCHAR(255) NULL
);
CREATE INDEX performer_search_idx ON performer(epoch, instrument, full_name);

CREATE TABLE accompanist (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL
);

CREATE TABLE composer (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    years_active VARCHAR(25) NOT NULL,
    notes VARCHAR(255) NULL
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
    performance_id INTEGER NOT NULL,
    musical_piece_id INTEGER NOT NULL,
    movement VARCHAR(255) NULL
);
CREATE UNIQUE INDEX performance_pieces_idx ON performance_pieces(performance_id,musical_piece_id);

CREATE TABLE class_lottery (
                               class_name VARCHAR(25) NOT NULL,
                               lottery INTEGER NOT NULL);
CREATE UNIQUE INDEX lookup_class_lottery_idx ON class_lottery(class_name);

CREATE TABLE performer_ranked_choice (
    performer_id INTEGER NOT NULL,
    concert_series VARCHAR(255) NOT NULL,
    pafe_series INTEGER NOT NULL,
    concert_chair_choice BOOLEAN NOT NULL DEFAULT FALSE,
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
    class_name VARCHAR(255) NOT NULL,
    concert_series VARCHAR(255) NOT NULL,
    pafe_series INTEGER NOT NULL,
    duration INTEGER DEFAULT 0 NOT NULL,
    accompanist_id INTEGER NULL,
    instrument instrument_list,
    comment VARCHAR(500) NULL,
    warm_up_room_name VARCHAR(255) NULL,
    warm_up_room_start TIMESTAMP NULL,
    warm_up_room_end TIMESTAMP NULL
);

CREATE TABLE concert_times (
    concert_series VARCHAR(255) NOT NULL,
    pafe_series INTEGER NOT NULL,
    concert_number_in_series INTEGER NOT NULL DEFAULT 0,
    start_time TIMESTAMP NOT NULL
);

INSERT INTO concert_times (concert_series, pafe_series,concert_number_in_series,start_time)
VALUES ('Concerto',37,0,'04/27/2025T15:00:00');
INSERT INTO concert_times (concert_series, pafe_series,concert_number_in_series,start_time)
VALUES ('Eastside',37,1,'05/03/2025T16:00:00');
INSERT INTO concert_times (concert_series, pafe_series,concert_number_in_series,start_time)
VALUES ('Eastside',37,2,'05/03/2025T19:00:00');
INSERT INTO concert_times (concert_series, pafe_series,concert_number_in_series,start_time)
VALUES ('Eastside',37,3,'05/04/2025T14:00:00');
INSERT INTO concert_times (concert_series, pafe_series,concert_number_in_series,start_time)
VALUES ('Eastside',37,4,'05/04/2025T17:00:00');


INSERT INTO composer (full_name, years_active) VALUES ('Adele Adkins','1988 - current');
INSERT INTO composer (full_name, years_active) VALUES ('Amy Beach','1867 - 1944');
INSERT INTO composer (full_name, years_active) VALUES ('Antonín Dvořák','1841 - 1904');
INSERT INTO composer (full_name, years_active) VALUES ('Antonio Vivaldi','1678 - 1741');
INSERT INTO composer (full_name, years_active) VALUES ('Aram Khachaturian','1903 - 1978');
INSERT INTO composer (full_name, years_active) VALUES ('Bohuslav Martinu','1890 - 1959');
INSERT INTO composer (full_name, years_active) VALUES ('Camille Saint-Saëns','1835 - 1921');
INSERT INTO composer (full_name, years_active) VALUES ('Carl Böhm','1844 - 1920');
INSERT INTO composer (full_name, years_active) VALUES ('Carl Maria von Weber','1786 - 1826');
INSERT INTO composer (full_name, years_active) VALUES ('Carl Philipp Stamitz','1745 - 1801');
INSERT INTO composer (full_name, years_active) VALUES ('Charles Dancla','1817 - 1907');
INSERT INTO composer (full_name, years_active) VALUES ('Dan Wilson','1961 - current');
INSERT INTO composer (full_name, years_active) VALUES ('Dmitri Shostakovich','1906 - 1975');
INSERT INTO composer (full_name, years_active) VALUES ('Édouard Lalo','1823 - 1892');
INSERT INTO composer (full_name, years_active) VALUES ('Edward Elgar','1857 - 1934');
INSERT INTO composer (full_name, years_active) VALUES ('Emile Pessard','1843 - 1917');
INSERT INTO composer (full_name, years_active) VALUES ('Frank Wildhorn','1958 - current');
INSERT INTO composer (full_name, years_active) VALUES ('Franz Joseph Haydn','1732 - 1809');
INSERT INTO composer (full_name, years_active) VALUES ('Franz Liszt','1811 - 1886');
INSERT INTO composer (full_name, years_active) VALUES ('Frédéric Chopin','1810 - 1849');
INSERT INTO composer (full_name, years_active) VALUES ('Georg Philipp Telemann','1681 - 1767');
INSERT INTO composer (full_name, years_active) VALUES ('George Frideric Handel','1685 - 1759');
INSERT INTO composer (full_name, years_active, notes) VALUES ('Georges Bizet','1838 - 1875','Bizet');
INSERT INTO composer (full_name, years_active) VALUES ('Henri Vieuxtemps','1820 - 1881');
INSERT INTO composer (full_name, years_active) VALUES ('Henryk Wieniawski','1835 - 1881');
INSERT INTO composer (full_name, years_active) VALUES ('Irving Berlin','1888 - 1989');
INSERT INTO composer (full_name, years_active) VALUES ('Jean Sibelius','1865 - 1957');
INSERT INTO composer (full_name, years_active) VALUES ('Johann Christian Bach','1735 - 1782');
INSERT INTO composer (full_name, years_active, notes) VALUES ('Johann Sebastian Bach','1685 - 1750', 'Johan Sebastian bach');
INSERT INTO composer (full_name, years_active) VALUES ('Maurice Ravel','1875 - 1837');
INSERT INTO composer (full_name, years_active) VALUES ('Max Bruch','1838 - 1920');
INSERT INTO composer (full_name, years_active) VALUES ('Niccolò Paganini','1782 - 1840');
INSERT INTO composer (full_name, years_active) VALUES ('Nikolai Kapustin','1937 - 2020');
INSERT INTO composer (full_name, years_active) VALUES ('Otar Gordeli','1928 - 1994');
INSERT INTO composer (full_name, years_active) VALUES ('Pablo de Sarasate','1844 - 1908');
INSERT INTO composer (full_name, years_active, notes) VALUES ('Pyotr Ilyich Tchaikovsky','1840 - 1893','Tchaikovsky');
INSERT INTO composer (full_name, years_active) VALUES ('Richard Rodgers','1902 - 1979');
INSERT INTO composer (full_name, years_active) VALUES ('Robert Schumann','1810 - 1856');
INSERT INTO composer (full_name, years_active) VALUES ('Rossini Niccolò Paganini','1782 - 1840');
INSERT INTO composer (full_name, years_active) VALUES ('Sergei Prokofiev','1891 - 1953');
INSERT INTO composer (full_name, years_active) VALUES ('William Gillock','1917 - 1993');
INSERT INTO composer (full_name, years_active, notes) VALUES ('William Henry Squire','1871 - 1963', 'William H. Squire');
INSERT INTO composer (full_name, years_active) VALUES ('Wolfgang Amadeus Mozart','1756 - 1791');
INSERT INTO composer (full_name, years_active) VALUES ('Luigi Boccherini','1745 - 1805');
INSERT INTO composer (full_name, years_active) VALUES ('Gabriel Fauré','1842 - 1924');
INSERT INTO composer (full_name, years_active) VALUES ('Ludwig van Beethoven','1770 - 1827');