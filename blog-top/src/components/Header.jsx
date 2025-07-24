
import { Avatar, Button, Dropdown, Navbar, TextInput } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoLight from '../assets/logo/logo.png';
import logoDark from '../assets/logo/logow.png';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';

export default function Header() {
  const path = useLocation().pathname;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const fetchCsrfToken = async () => {
      const res = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      const data = await res.json();
      setCsrfToken(data.csrfToken);
    };
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    try {
      const res = await fetch('/api/user/signout', {
        method: 'POST',
        headers: {
          'CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  return (
    <Navbar
      className={`border-b-4  ${
        theme === 'dark'
          ? 'bg-gray-900 text-white border-green-700 shadow-[0_6px_6px_-1px_rgba(34,197,94,0.6)]'
          : 'bg-white text-gray-900 border-green-400 shadow-[0_2px_6px_-1px_rgba(34,197,94,0.6)]'
      }`}
    >
      <Link to="/" className="flex items-center space-x-2">
        <img
          src={theme === 'dark' ? logoDark : logoLight}
          alt="Blog-top logo"
          className="w-10 h-10 rounded-full object-cover"
        />
        <h1 className="text-lg font-bold">
          <span className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>
            BLOG
          </span>
          <span className="text-green-600">-TOP</span>
        </h1>
      </Link>

      <form onSubmit={handleSubmit} className="relative hidden lg:block w-80">
        <TextInput
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          theme={{
            field: {
              input: {
                base: `${
                  theme === 'dark'
                    ? 'bg-gray-800 border-green-500 text-white'
                    : 'bg-white border-green-400 text-black'
                } text-sm rounded-lg block w-full p-2.5 pr-10`,
                colors: {
                  gray: 'focus:ring-green-500 focus:border-green-500',
                },
              },
            },
          }}
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
        >
          <AiOutlineSearch size={20} />
        </button>
      </form>

      {/* Search Button (mobile) with green ring on focus/hover */}
      <Button
        className="w-12 h-10 lg:hidden focus:ring-green-500 hover:ring-green-500 focus:ring-2 focus:outline-none"
        color="gray"
        pill
        onClick={handleSubmit}
        aria-label="Mobile Search"
      >
        <AiOutlineSearch />
      </Button>

      <div className="flex gap-2 md:order-2">
        {/* Theme toggle button with green ring on focus/hover */}
        {/* <Button
          className="w-12 h-10 hidden sm:inline focus:ring-green-500 hover:ring-green-500 focus:ring-2 focus:outline-none"
          color="gray"
          pill
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <FaSun /> : <FaMoon />}
        </Button> */}

        {currentUser ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={<Avatar alt="user" img={`/uploads/${currentUser.profilePicture}`} rounded />}
          >
            <Dropdown.Header>
              <span className="block text-sm">@{currentUser.username}</span>
              <span className="block text-sm font-medium truncate">{currentUser.email}</span>
            </Dropdown.Header>
            <Link to={'/dashboard?tab=profile'}>
              <Dropdown.Item>Profile</Dropdown.Item>
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>Sign out</Dropdown.Item>
          </Dropdown>
        ) : (
          <Link to="/sign-in">
            <Button color="success">
              Sign In
            </Button>
          </Link>
        )}

        <Navbar.Toggle />
      </div>

      <Navbar.Collapse>
        {[
          { path: '/', label: 'Home' },
          { path: '/about', label: 'About' },
      
          { path: '/createflag', label: 'Create Post' },
        ].map((item) => (
          <div key={item.path}>
            <Link
              to={item.path}
              className={`px-3 py-2 rounded transition-colors duration-200 ${
                path === item.path
                  ? 'text-green-600'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-green-600'
                  : 'text-gray-700 hover:text-green-600'
              }`}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </Navbar.Collapse>
    </Navbar>
  );
}
