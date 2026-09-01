import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Download, User } from 'lucide-react';
import { Alumni } from '../types/alumni';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { apiService } from '../../services/api';

const AlumniDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState({
    employer: '',
    salary: '',
    program: '',
  });


  const itemsPerPage = 15;

  const filteredAlumni = alumni.filter(person => {
    const matchesSearch =
      !searchTerm ||
      `${person.first_name || ''} ${person.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.wildcat_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployer =
      !filters.employer || person.employer_name === filters.employer;

    const matchesSalary = !filters.salary || person.salary === filters.salary;

    const matchesProgram = !filters.program || person.program_name === filters.program;

    return matchesSearch && matchesEmployer && matchesSalary && matchesProgram;
  });

  const sortedAlumni = [...filteredAlumni];

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Alumni;
    direction: 'asc' | 'desc';
  }>({
    key: 'first_name',
    direction: 'asc'
  });

  if (sortConfig !== null) {
    sortedAlumni.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });
  }

  const totalAlumni = sortedAlumni?.length;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedAlumni = sortedAlumni.slice(startIndex, endIndex);

  const handleSort = (key: keyof Alumni) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const employerOptions = [...new Set(
    alumni
      ?.map(person => person.employer_name?.trim())
      .filter((dept): dept is string => !!dept)
  )].sort();

  const salaryOptions = [...new Set(
    alumni
      ?.map(person => person.salary?.trim())
      .filter((degree): degree is string => !!degree)
  )].sort();

  const programOptions = [...new Set(
    alumni
      ?.map(person => person.program_name?.trim())
      .filter((program): program is string => !!program)
  )].sort();

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);

        const data = await apiService.getAllAlumni();
        setAlumni(Array.isArray(data) ? data : []);
        setAlumni(prevAlumni =>
          prevAlumni?.map(alumni => {
            if (!alumni.first_name) {
              return { ...alumni, first_name: alumni.temp_name };
            }
            return alumni;
          })
        );
      } catch (error) {
        console.error('Error fetching alumni data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, [currentPage, searchTerm, filters]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search

    // Update URL search params
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    navigate(`?${params.toString()}`);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFilters(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        [name]: value
      };

      return updatedFilters;
    });

    setCurrentPage(1);
  };

  const handleClearFilter = (e) => {
    setFilters(prevFilters => {
      const updatedFilters = {
        ...prevFilters,
        employer: '',
        salary: '',
        program: '',
      };

      return updatedFilters;
    });

  };

  const handleRowClick = (alumni: Alumni) => {
    navigate(`/alumni/${alumni.alumni_id}`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Alumni Directory"
        description="Browse and search all alumni records"
      >
        <button className="btn btn-primary flex items-center gap-2">
          <Download size={16} />
          <span>Export Data</span>
        </button>
      </PageHeader>



      <div className="bg-white shadow-sm rounded-lg p-4 mb-6 ">
        <h2 className="text-lg font-medium">Filter By:</h2>

        <div className="flex flex-col md:flex-row gap-4 mt-10">


          {/* Dropdown filter for PROGRAM NAME */}
          <div className="flex flex-col md:flex-row md:justify-between gap-2  w-full">

            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Program:</span>
            </div>

            <select
              name="program"
              value={filters.program}
              onChange={handleFilterChange}
              className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-25 focus:ring-weber-purple focus:border-weber-purple sm:text-sm">
              <option value="">All Programs</option>
              {programOptions?.map(program => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>
          </div>



          {/* Dropdown filter for Department */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Employers:</span>
            </div>

            <select
              name="employer"
              value={filters.employer}
              onChange={handleFilterChange}
              className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-25 focus:ring-weber-purple focus:border-weber-purple sm:text-sm max-w-50">
              <option value="">All Employers</option>
              {employerOptions?.map(emp => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>


          {/* Dropdown filter for DEGREE TYPE */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Salary:</span>
            </div>

            <select
              name="salary"
              value={filters.salary}
              onChange={handleFilterChange}
              className=" w-full max-w-xs overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-gray-300 shadow-sm min-w-40 focus:ring-weber-purple focus:border-weber-purple sm:text-sm">
              <option value="">All Salaries</option>
              {salaryOptions?.map(salary => (
                <option key={salary} value={salary}>
                  {salary}
                </option>
              ))}
            </select>

            <button
              className="pt-2 text-sm text-gray-500 text-nowrap pl-3"
              onClick={handleClearFilter}>
              Clear Filters
            </button>
          </div>
        </div>

      </div>

      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-5">Search</h2>
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-weber-purple focus:border-weber-purple sm:text-sm ht-5"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <DataTable
          columns={[
            {
              header: 'Name',
              accessor: 'first_name',
              render: (_, row) => (
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-weber-purple text-white rounded-full flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {row.first_name} {row.last_name}
                    </div>

                  </div>
                </div>
              )
            },
            {
              header: 'Email', accessor: 'alt_email',
              render: (value, row) => {
                const main = row.alt_email || row.email;
                const isAlt = !row.employer_name && !!row.alt_email;

                return (
                  <span>{main}</span>
                )
              }
            },

            {
              header: 'Program',
              accessor: 'program_name',
              render: value => (
                <span className="chip bg-neutral-100">
                  {value || 'N/A'}
                </span>
              )
            },

            {
              header: 'Employer',
              accessor: 'employer_name',
              render: (value, row) => {
                const employer = row.employer_name || row.alt_employer_name;
                const isAlt = !row.employer_name && !!row.alt_employer_name;

                if (!employer) return 'N/A';

                return (
                  <span className={isAlt ? 'chip bg-neutral-300 text-weber-purple' : 'chip bg-neutral-100 text-green-600  font-800'}>
                    {employer}
                  </span>
                );
              }
            },
            {
              header: 'Salary',
              accessor: 'salary',
              render: value => (
                <span className="chip bg-neutral-100">
                  {value || 'N/A'}
                </span>
              )
            },

          ]}
          data={paginatedAlumni}
          loading={loading}
          emptyMessage="No alumni records found. Try adjusting your filters."
          onRowClick={handleRowClick}
          sortConfig={sortConfig}
          onSort={handleSort}
        />

        {!loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalAlumni / itemsPerPage)}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;