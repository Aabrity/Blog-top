
"use client"

import { Sidebar } from "flowbite-react"
import { useEffect, useState } from "react"
import {
    HiAnnotation,
    HiArrowSmRight,
    HiChartPie,
    HiDocumentText,
    HiExclamation,
    HiFlag,
    HiOutlineUserGroup,
    HiUser,
} from "react-icons/hi"
import { useDispatch, useSelector } from "react-redux"
import { Link, useLocation } from "react-router-dom"
import { signoutSuccess } from "../redux/user/userSlice"

export default function DashSidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const [tab, setTab] = useState("")
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabFromUrl = urlParams.get("tab")
    if (tabFromUrl) {
      setTab(tabFromUrl),
      fetchCSRFToken(); // Fetch CSRF token when tab changes
    }
  }, [location.search])

  // const handleSignout = async () => {
  //   try {
  //     const res = await fetch("/api/user/signout", {
  //       method: "POST",
  //     })
  //     const data = await res.json()
  //     if (!res.ok) {
  //       //console.log(data.message)
  //     } else {
  //       dispatch(signoutSuccess())
  //     }
  //   } catch (error) {
  //     //console.log(error.message)
  //   }
  // }
const handleSignout = async () => {
  try {
    const res = await fetch("/api/user/signout", {
      method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Content-Type-Options": "nosniff",
            "CSRF-Token": csrfToken,
          },
      credentials: "include",  // <-- important for cookies
    });
    const data = await res.json();
    if (!res.ok) {
      //console.log(data.message);
    } else {
      dispatch(signoutSuccess());
      // Optionally redirect or update UI here
    }
  } catch (error) {
    //console.log(error.message);
  }
};
 const fetchCSRFToken = async () => {
    try {
      const res = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      const data = await res.json();
      setCsrfToken(data.csrfToken);
    } catch (err) {
      console.error("Error fetching CSRF token:", err);
    }
  };

  // 🔐 Role-Based Navigation Items
  const navigationItems = [
    // Admin-only dashboard
    ...(currentUser?.isAdmin
      ? [
          {
            label: "Dashboard",
            icon: HiChartPie,
            href: "/dashboard?tab=dash",
            isActive: tab === "dash" || !tab,
          },
        ]
      : []),

    // Shared: Profile tab
    {
      label: "Profile",
      icon: HiUser,
      href: "/dashboard?tab=profile",
      isActive: tab === "profile",
      badge: currentUser?.isAdmin ? "Admin" : "User",
    },

    // Normal user: Your Flags
    ...(!currentUser?.isAdmin
      ? [
          {
            className: "mt-4",
            label: "Your Flags",
            icon: HiFlag,
            href: "/dashboard?tab=showposts",
            isActive: tab === "showposts",
          },
        ]
      : []),

    // Admin-only tools
    ...(currentUser?.isAdmin
      ? [
          {
            label: "Posts",
            icon: HiDocumentText,
            href: "/dashboard?tab=posts",
            isActive: tab === "posts",
          },
          {
            label: "Users",
            icon: HiOutlineUserGroup,
            href: "/dashboard?tab=users",
            isActive: tab === "users",
          },
          {
            label: "Comments",
            icon: HiAnnotation,
            href: "/dashboard?tab=comments",
            isActive: tab === "comments",
          },
          {
            label: "Reports",
            icon: HiExclamation,
            href: "/dashboard?tab=reports",
            isActive: tab === "reports",
          },
          {
            label: "Logs",
            icon: HiExclamation,
            href: "/dashboard?tab=logs",
            isActive: tab === "logs",
          },
        ]
      : []),
  ]

  return (
    <div className="h-full">
      <Sidebar
        className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700"
        theme={{
          root: {
            base: "h-full bg-white dark:bg-gray-900",
            inner:
              "h-full overflow-y-auto overflow-x-hidden bg-white py-4 px-3 dark:bg-gray-900",
          },
        }}
      >
        {/* Header */}
        <div className="mb-6 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <HiChartPie className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentUser?.username}
              </p>
            </div>
          </div>
        </div>

        <Sidebar.Items>
          <Sidebar.ItemGroup className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.label} to={item.href}>
                <Sidebar.Item
                  active={item.isActive}
                  icon={item.icon}
                  labelColor={item.badge === "Admin" ? "blue" : "gray"}
                  as="div"
                  className={`group flex items-center p-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    item.isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="ml-3 flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.badge === "Admin"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Sidebar.Item>
              </Link>
            ))}
          </Sidebar.ItemGroup>

          {/* Separator */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Sign Out */}
          <Sidebar.ItemGroup>
            <Sidebar.Item
              icon={HiArrowSmRight}
              onClick={handleSignout}
              as="div"
              className="group flex items-center p-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 text-gray-700 hover:bg-green-50 hover:text-green-700 dark:text-gray-300 dark:hover:bg-green-900 dark:hover:text-green-200"
            >
              <span className="ml-3">Sign Out</span>
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </div>
  )
}
