import { useState } from "react";
import {Navigate, Outlet} from "react-router-dom";
import clsx from "clsx";
import "./ProtectedLayout.scss";
import Sidebar from "../Sidebar/Sidebar.tsx";
import {Toaster} from "react-hot-toast";
import {useAppSelector} from "../../utils/store/hooks.ts";

export default function ProtectedLayout() {
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={clsx("protected-layout", !isOpen && "collapsed")}>
      <Toaster />
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="protected-layout__content">
        <Outlet />
      </div>
    </div>
  );
}
