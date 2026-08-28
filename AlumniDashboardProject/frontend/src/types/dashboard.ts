export interface DashboardStats {
    totalAlumni: number;
    averageSalary: number;
    gradSchoolRate: number;
    overviewPerDept: {
        department_id: number;
        department_name: string;
        numAlum: number;
    }[];
    alumniPerProgram: {
        department_id: number;
        department_name: string;
        name: string;
        numAlum: number;
    }[];
    careerOutlook: {
        value_text: string;
        numAnswers: number;
    }[];
    postGradData: {
        value_text: string;
        totalPerDestination: number;
    }[];
    gradSchools: {
        value_text: string;
        numStudentsPerSchool: number;
    }[];
    averageSalaryPerTerm: {
        value_text: string;
        numAlum: number;
    }[];
    primaryClassFormat: {
        subquestion_text: string;
        value_text: string;
        percentage: number;
    }[];
    top5Employers: {
        value_text: string;
        numAlum: number;
    }[];
    employerByCounty: {
        value_text: string;
        numAlum: number;
    }[];
    top5InternshipCo: {
        value_text: string;
        numAlum: number;
    }[];
    internshipByLocation: {
        value_text: string;
        numAlum: number;
    }[];
    programOfStudyApproval: {
        value_text: string;
        percentage: number;
    }[];
    programOfStudyImprovements: {
        value_text: string;
        percentage: number;
    }[];
    hoursWorked: {
        value_text: string;
        percentage: number;
    }[];
    gradDegreePursue: {
        value_text: string;
        percentage: number;
    }[];
    workExperience: {
        value_text: string;
        percentage: number;
    }[];
}

export interface EmploymentByMajorData {
    program: string;
    count: number;
}

export interface SalaryByMajorData {
    program: string;
    averageSalary: number;
}

export interface overviewPerDept {
    department_id: number;
    department_name: string;
    numAlum: number;
}

export interface alumniPerProgram {
    department_id: number;
    department_name: string;
    name: string;
    numAlum: number;
}

export interface careerOutlook {
    numAnswers: number;
    value_text: string;
}

export interface postGradData {
    value_text: string;
    totalPerDestination: number;
}

export interface gradSchools {
    value_text: string;
    numStudentsPerSchool: number;
}

export interface averageSalaryPerTerm {
    value_text: string;
    numAlum: number;
}

export interface primaryClassFormat {
    subquestion_text: string;
    value_text: string;
    numAlum: number;
}

export interface top5Employers {
    value_text: string;
    numAlum: number;
}

export interface employerByCounty {
    value_text: string;
    numAlum: number;
}

export interface top5InternshipCo {
    value_text: string;
    numAlum: number;
}

export interface internshipByLocation {
    value_text: string;
    numAlum: number;
}

export interface programOfStudyApproval {
    value_text: string;
    percentage: number;
}

export interface programOfStudyImprovements {
    value_text: string;
    percentage: number;
}

export interface programOfStudyImprovements {
    value_text: string;
    percentage: number;
}

export interface hoursWorked {
    value_text: string;
    percentage: number;
}

export interface gradDegreePursue {
    value_text: string;
    percentage: number;
}

export interface workExperience {
    value_text: string;
    percentage: number;
}