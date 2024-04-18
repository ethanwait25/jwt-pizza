import React from 'react';
import { NavLink } from 'react-router-dom';
import { HouseIcon, GreaterThanIcon } from '../icons';

export default function Breadcrumb({ location }) {
  return (
    <ol className='flex items-center whitespace-nowrap py-2 px-4 bg-gray-300'>
      <li className='inline-flex items-center'>
        <NavLink
          className='flex items-center text-sm text-gray-500 hover:text-blue-600 focus:outline-none focus:text-blue-600 dark:focus:text-blue-500'
          to='/'
        >
          <HouseIcon />
          Home
        </NavLink>
      </li>
      {location && (
        <li
          className='inline-flex items-center text-sm font-semibold text-gray-800 truncate dark:text-gray-200'
          aria-current='page'
        >
          <GreaterThanIcon />
          {location}
        </li>
      )}
    </ol>
  );
}