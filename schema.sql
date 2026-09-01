DROP DATABASE IF EXISTS alumniDB;
CREATE DATABASE alumniDB;
USE alumniDB;

CREATE TABLE survey (
    survey_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_name VARCHAR(200) NOT NULL
);

CREATE TABLE survey_version (
    survey_version_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    version_name VARCHAR(200) NOT NULL,
    term_label VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES survey(survey_id)
);

CREATE TABLE alumni (
    alumni_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    alt_email varchar(200), 
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    temp_name varchar(100) null,
    wildcat_id varchar(100),
    graduation_date varchar(50) null,
    phone varchar(12) null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (email, wildcat_id)
);

CREATE TABLE department (
	department_id INT auto_increment primary key,
    department_name varchar(200) UNIQUE
);

CREATE TABLE program_of_study ( 	

    program_id INT PRIMARY KEY AUTO_INCREMENT,
    department_id INT NOT NULL,
    program_name VARCHAR(255) NOT NULL,

    FOREIGN KEY (department_id)
        REFERENCES department(department_id)
);

CREATE TABLE alumni_degrees (
    alumni_degree_id INT AUTO_INCREMENT PRIMARY KEY,
    alumni_id INT NOT NULL,
    program_id INT,
    raw_degree_code varchar(100) null,
    degree_type varchar(20) null,
    survey_time_raw varchar(50) null,
    survey_term varchar(20),
    survey_year varchar(20),
    gpa varchar(20),
    first_year_attended varchar(20),
    minor varchar(100),
    
    foreign key (program_id) references program_of_study(program_id),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id) ON DELETE CASCADE
);

CREATE TABLE survey_attempt (
    survey_attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    alumni_id INT NOT NULL,
    survey_version_id INT NOT NULL,
    source_row_number INT,
    survey_time varchar(200),
    source_response_id varchar(255) null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_survey_attempt_response UNIQUE (survey_version_id, source_response_id),
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id),
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id)
);

CREATE TABLE question (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_version_id INT NOT NULL,
    question_code VARCHAR(100) NOT NULL,
    question_text VARCHAR(1000),
    question_cat_abbr varchar(20),
    question_category varchar(255), 
    question_type VARCHAR(50) NOT NULL,
    question_group_code VARCHAR(255),
    subquestion_text varchar(600) null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (survey_version_id, question_code),
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id)
);

CREATE TABLE question_option (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_code VARCHAR(100) NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    UNIQUE (question_id, option_code),
    FOREIGN KEY (question_id) REFERENCES question(question_id)
);

CREATE TABLE response (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    value_text TEXT NULL,
    option_code varchar(100), 
    option_text TEXT,
    subquestion_text VARCHAR(300) null,
    value_number DECIMAL(10,2) NULL,
    value_boolean BOOLEAN NULL,
    raw_value TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_attempt_id) REFERENCES survey_attempt(survey_attempt_id),
    FOREIGN KEY (question_id) REFERENCES question(question_id)
);


CREATE TABLE import_batch (
    import_batch_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_version_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_hash char(64) null,
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id)
);

CREATE TABLE import_column_mapping (
    mapping_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_version_id INT NOT NULL,
    raw_column_name VARCHAR(255) NOT NULL,
    normalized_column_name VARCHAR(255) NOT NULL,
    field_role VARCHAR(50) NOT NULL,
    question_code VARCHAR(100) NULL,
    option_code VARCHAR(100) NULL,
    target_table VARCHAR(100) NULL,
    target_column VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (survey_version_id, raw_column_name),
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id)
);

CREATE TABLE pending_mapping_review (
    pending_mapping_id INT AUTO_INCREMENT PRIMARY KEY,
    survey_version_id INT NOT NULL,
    raw_column_name VARCHAR(255) NOT NULL,
    normalized_column_name VARCHAR(255) NOT NULL,
    sample_value TEXT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id)
);

CREATE TABLE raw_import_row (
    raw_import_row_id INT AUTO_INCREMENT PRIMARY KEY,
    import_batch_id INT NOT NULL,
    source_row_number INT NOT NULL,
    raw_payload_json JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_batch_id) REFERENCES import_batch(import_batch_id)
);

CREATE TABLE employer (
	employer_id int AUTO_INCREMENT PRIMARY KEY,
    employer_name varchar(255),
    employer_city varchar(255), 
    employer_state varchar(255),
    employer_country varchar(255) DEFAULT 'United States'
);

CREATE TABLE employment (
    employment_id INT AUTO_INCREMENT PRIMARY KEY,
    alumni_id INT NOT NULL,
    employer_id int,
    alt_employer_name varchar(255),
    survey_attempt_id INT,
    job_position VARCHAR(500),
    salary INT,
    salary_STRING varchar(100),
    country varchar(500) DEFAULT 'United States',
    city varchar(500),
    state varchar(100),
    yrs_exp varchar(50),
    major_match varchar(10),
    is_current BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id),
    FOREIGN KEY (survey_attempt_id) REFERENCES survey_attempt(survey_attempt_id),
    FOREIGN KEY (employer_id) REFERENCES employer(employer_id)
);

CREATE TABLE employment_questions (
	alumni_id INT NOT NULL,
    employment_id INT NOT NULL,
    q1 TEXT,
    q2 TEXT,
    q3 TEXT,
    q4 TEXT,
    q5 TEXT,
    q6 TEXT,
    q7 TEXT,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id),
    FOREIGN KEY (employment_id) REFERENCES employment(employment_id)
);

CREATE TABLE internship (
    internship_id INT AUTO_INCREMENT PRIMARY KEY,
    alumni_id INT NOT NULL,
    survey_attempt_id INT,
    intern_business VARCHAR(255),
    for_credit boolean,
    not_for_credit boolean,
    n_a boolean,
    intern_city varchar(300),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alumni_id) REFERENCES alumni(alumni_id),
    FOREIGN KEY (survey_attempt_id) REFERENCES survey_attempt(survey_attempt_id)
);

CREATE TABLE metadata (
	survey_version_id INT NOT NULL,
    survey_attempt_id INT NOT NULL,
    metadata JSON,
    FOREIGN KEY (survey_version_id) REFERENCES survey_version(survey_version_id),
    FOREIGN KEY (survey_attempt_id) REFERENCES survey_attempt(survey_attempt_id)
);


-- sample inserts

INSERT INTO survey (survey_name)
VALUES
('Mock Survey');

INSERT INTO survey_version (survey_id, version_name, term_label)
VALUES
(1, 'Version 1', 'Fall 2026');

INSERT INTO department (department_name)
VALUES ('School of Computing'),
		('Automotive Technology'),
        ('Construction & Building Sciences'),
        ('Electrical & Computer Engineering'),
        ('Manufacturing & Systems Engineering'),
        ('Mechanical Engineering'),
        ('Professional Sales');
        
INSERT INTO program_of_study (department_id, program_name)
VALUES
	('1', 'Computer Science'),
    ('1', 'Network Management Tech'),
    ('1', 'Cybersecurity'),
    ('1', 'Customized CS'),
    ('1', 'Programming Essentials'),
    ('1', 'Game Development'),
    ('1', 'Cybersecurity Essentials'),
    ('1', 'Cyber Policy and Management'),
    ('1', 'Cloud Computing'),
    ('1', 'Network Security Tech'),
    ('1', 'Web Development'),
    ('1', 'Web Development : Full Stack Concentration'),
    ('1', 'Web Development : User Experience & Design Concentration'),
    ('1', 'User Experience and Design'),
    ('1', 'Web Essentials'),
    ('1', 'Automomous Vehicle Software'),
    ('1', 'Computational Data Science and Machine Learning'),
    ('1', 'Computer Science Teaching'),
    ('1', 'Data Science'),
    
    
    ('2', 'Automotive Tech'),
    ('2', 'Automotive Service Tech'),
    ('2', 'Automotive Maintenance and Light Repair'),
    ('2', 'Hybrid and Electric Vehicle Maintenance Certificate of Proficiency'),
    ('2', 'Advanced Hybrid and Electric Vehicle Certificate of Proficiency'),
    ('2', 'Automotive and Vehicle Engineering Tech'),
    ('2', 'Option'),
    ('2', 'Field Service Operations'),
    ('2', 'Advanced Vehicle Systems'),
    ('2', 'Independent Shop'),
    
    ('3', 'Design-Build Essentials'),
    ('3', 'Construction Apprenticeship'),
    ('3', 'Pre-Architecture'),
    ('3', 'Construction Management Tech'),
    ('3', 'Interior Design'),
    ('3', 'Building and Design Construction'),
    ('3', 'Architecture, Engineering and Construction Tech'),
    ('3', 'Architectural Design'),
    ('3', 'Construction Management'),
    ('3', 'Design Graphics Engineering Tech'),
    
    ('4', 'Biomedical Engineering'),
    ('4', 'Computer Engineering'),
    ('4', 'Electrical Engineering'),
    ('4', 'Electronics Engineering Tech'),
    ('4', 'General Technology'),
    
    ('5', 'Product Design and Development'),
    ('5', 'Manufacturing Engineering Technology'),
    ('5', 'MFET: Plastics and Composites Emphasis'),
    ('5', 'MFET: Welding Emphasis'),
    ('5', 'Manufacturing Systems Engineer'),
    ('5', 'Quality and Lean Manufacturing'),
    ('5', 'Systems Engineering and Sustainable Engineering'),
    ('5', 'Systems Engineering'),
    
    ('6', 'Pre Engineering'),
    ('6', 'Mechanical Engineering Tech'),
    ('6', 'Energy Engineering'),
    ('6', 'Mechanical Engineering'),
    
    ('7', 'Sales and Merchandising'),
    ('7', 'Sales and Service Tech'),
    ('7', 'Professional Sales')
    ;
        
#INSERT Employers:

INSERT INTO employer (employer_name)
VALUES ('BAE'), ('Northrop Grumman'), ('JD Machines'), ('Davis Tech College'), ('Hill AFB'), ('Autoliv'), ('America First Credit Union'), ('Weber State University'), ('Ogden-Weber Technical College'), 
('FedEx'), ('The Church of Jesus Christ of Latter-day Saints'), ('United States Airforce'), ('Starbucks'), ('Becklar'), ('United Postal Service'), ('Home Depot'), ('Kroger'), 
('Williams International'), ('Kihomac'), ('HP'), ('IBM'), ('IRS'), ('Mark Ashby'), ('Chromalox'), ('Whitney Solutions LLC'), ('University of Utah'), ('Walmart'), ('Enterprise Mobility'), ('Big-D Construction'), ('Boeing')
,('Clearlink'), ('Datafy'), ('Davis School District'), ('Department of Defense'), ('Ford Motor Company'), ('Freeus'), ('GoEngineer'), ('Intermountain Health'), ('John Deere'), ('Lifetime Products'), ('Marketstar'), ('Microsoft'), ('Navitaire')
,('NWL Architects'), ('Parker Hannifin'), ('PCC Structurals'), ('Petersen Inc'), ('Pluralsight'), ('R&O Construction'), ('Trace Minerals Research'), ('Tukios'), ('Wayfair');
