import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Briefcase, Users, Building2,
  CheckSquare, Users2, Goal, Ticket, FileText, BarChart3, Mail, Calendar,
  Landmark, Package, Factory, User, LogOut, Settings, ChevronDown,
  LandmarkIcon, Search,
  PanelLeftClose, PanelLeftOpen,
  Headset,
  PackagePlus,
  ClipboardList,
  TrendingUp,
  UserCircle,
  Phone,
  MapPin,
  IdCard,
  UserCheck,
} from 'lucide-react';
import { TbLayoutGridFilled } from "react-icons/tb";
import { SiSimpleanalytics } from "react-icons/si";
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false); // ← confirmation dialog

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 🔐 Safe user data retrieval
  const getUser = () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData || userData === 'undefined') {
        return {};
      }
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      localStorage.removeItem('user');
      return {};
    }
  };

  const user = getUser();
  const userName = user?.full_name || user?.username || 'User';
  const userEmail = user?.email || '';
  const userFatherName = user?.father_name || '';
  const userCNIC = user?.cnic || '';
  const userGender = user?.gender || '';
  const userPhone = user?.phone || '';
  const userAddress = user?.address || '';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Menu sections (unchanged)
  const menuSections = [
    // ... same as before (keep your existing menu)
    {
      title: "Dashboard",
      items: [
        { icon: TbLayoutGridFilled, label: "Overview", path: "" },
        { icon: BarChart3, label: "Analytics", path: "analytics" },
        { icon: BarChart3, label: "Journal Entries", path: "journal-voucher" },
      ],
    },
    {
      title: "Sales & CRM",
      items: [
        { icon: LandmarkIcon, label: "Accounting", path: "accounting" },
        { icon: Users, label: "Customers", path: "customers" },
        { icon: Building2, label: "Companies", path: "companies" },
        { icon: TrendingUp, label: "Revenue", path: "revenue" },
        { icon: Ticket, label: "Sales Orders", path: "sale-orders" },
        { icon: Goal, label: "Invoices", path: "invoices" },
      ],
    },
    {
      title: "Products & Services",
      items: [
        { icon: Package, label: "Items", path: "items" },
        { icon: Goal, label: "Inventory", path: "inventory" },
        { icon: Briefcase, label: "Warehouses", path: "warehouses" },
      ],
    },
    {
      title: "Purchasing",
      items: [
        { icon: Users2, label: "Suppliers", path: "suppliers" },
        { icon: ClipboardList, label: "Purchase Orders", path: "purchase-orders" },
        { icon: PackagePlus, label: "Purchase Bills", path: "purchases" },
        { icon: FileText, label: "Payments", path: "payments" },
      ],
    },
    {
      title: "Finance",
      items: [
        { icon: Landmark, label: "Accounts", path: "accounts" },
        { icon: Calendar, label: "Expenses", path: "expenses" },
        { icon: Goal, label: "Reports", path: "reports" },
      ],
    },
    {
      title: "Human Resources",
      items: [
        { icon: Users2, label: "Employees", path: "employees" },
        { icon: Calendar, label: "Attendance", path: "attendance" },
        { icon: Goal, label: "Payroll", path: "payroll" },
        { icon: Mail, label: "Leave Requests", path: "leave-requests" },
      ],
    },
    {
      title: "Help Desk",
      items: [
        { icon: Headset, label: "Support", path: "support" },
        { icon: Mail, label: "Messages", path: "messages" },
      ],
    },
    {
      title: "Administration",
      items: [
        { icon: Users, label: "Users", path: "users" },
        { icon: Building2, label: "Roles & Permissions", path: "roles" },
        { icon: CheckSquare, label: "Settings", path: "settings" },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar (unchanged) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-black text-white transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto flex flex-col h-full ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center justify-center h-16 px-4 border-b border-[#1e293b] flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'px-2' : 'px-4'
        }`}>
          <h1 className={`text-xl font-semibold tracking-wider transition-all duration-300 ${
            sidebarCollapsed ? 'text-xs opacity-0 w-0 overflow-hidden' : 'opacity-100'
          }`}>
            FlowBooks Online
          </h1>
          {sidebarCollapsed && <span className="text-xl font-bold">F</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-5 custom-scrollbar">
          {menuSections.map((section, index) => (
            <div key={index} className={`mb-8 ${sidebarCollapsed ? 'hidden' : ''}`}>
              <h3 className="text-gray-200 text-sm font-semibold px-2 mb-2 uppercase tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <NavLink
                        to={item.path}
                        end={item.path === ''}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-1 rounded-xs 
                          border-l-8 transition-all duration-200
                          ${isActive 
                            ? 'border-orange-400 bg-orange-600 text-white font-bold' 
                            : 'border-transparent text-white hover:border-orange-400 hover:bg-orange-600 hover:text-white'
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {sidebarCollapsed && (
            <ul className="space-y-1">
              {menuSections.flatMap(section => section.items).map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx}>
                    <NavLink
                      to={item.path}
                      end={item.path === ''}
                      className={({ isActive }) => `
                        flex items-center justify-center px-2 py-2 rounded-xs 
                        border-l-8 transition-all duration-200
                        ${isActive 
                          ? 'border-orange-400 bg-orange-600 text-white font-bold' 
                          : 'border-transparent text-white hover:border-orange-400 hover:bg-orange-600 hover:text-white'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                      title={item.label}
                    >
                      <Icon size={18} />
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className={`p-4 text-xs text-white flex-shrink-0 transition-all duration-300 ${
          sidebarCollapsed ? 'text-center' : ''
        }`}>
          {sidebarCollapsed ? 'v2' : 'v2.0.1'}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with Avatar Dropdown */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-2 md:px-6 py-1 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:block p-1 hover:bg-gray-100 rounded-md transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-gray-600" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <span className="text-xl font-bold text-black capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4" ref={dropdownRef}>
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-full text-sm focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
                      <LogOut onClick={() => {
                        setDropdownOpen(false);      // close dropdown
                        setLogoutDialogOpen(true);   // open confirmation
                      }} className="w-4 h-4 cursor-pointer" />
                  </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* ─── Logout Confirmation Dialog ─── */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
  <AlertDialogOverlay className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

  <AlertDialogContent className="sm:max-w-md bg-white rounded-xs border-0 shadow-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-xl font-semibold">
        Logout {userName}?
      </AlertDialogTitle>

      <AlertDialogDescription>
        You can improve your security by closing this browser after logging out.
      </AlertDialogDescription>
    </AlertDialogHeader>

    <AlertDialogFooter>
      <AlertDialogCancel>No</AlertDialogCancel>

      <AlertDialogAction
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Logout
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
};

export default DashboardLayout;