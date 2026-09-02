import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Box,
  Tooltip,
  Button,
  Popover,
  Badge,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import {useLocation, useNavigate} from "react-router-dom";
import clsx from "clsx";
import "./Sidebar.scss";
import {useAppDispatch, useAppSelector} from "../../utils/store/hooks.ts";

import ShowChartIcon from '@mui/icons-material/ShowChart';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CheckIcon from "@mui/icons-material/Check";

import {logoutUser} from "../../utils/API/authAPI.ts";
import { useState } from "react";

export default function Sidebar({ isOpen, setIsOpen }: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const user = useAppSelector((state) => state.auth.user);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [anchorTelegramBotEl, setAnchorTelegramBotEl] = useState<null | HTMLElement>(null);
  const openTelegramBotPopover = Boolean(anchorTelegramBotEl);

  const handleLogout = async () => {
    await dispatch(logoutUser());

    navigate("/login");
  };

  return (
    <Box className="sidebar-root">
      <Drawer
        variant="permanent"
        className={clsx("sidebar", isOpen ? "open" : "collapsed")}
        PaperProps={{
          className: clsx("sidebar-paper", isOpen ? "open" : "collapsed"),
        }}
      >
        <Box className="sidebar-inner">
          <Box className={`sidebar-header ${isOpen ? "open" : ""}`}>
            {isOpen && <span className="title">Меню</span>}
            <IconButton onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Box>

          <Divider />
          {user && user?.role && (
            <List disablePadding>
              {["intern", "middle_tester", "buyer", "admin", "owner", "sm", "moder"].includes(user?.role) && (
                <Tooltip title={!isOpen ? "Трафик" : ""} placement="right">
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => navigate("/traffic")}
                      selected={location.pathname === "/traffic"}
                      sx={{ display: "flex", gap: 1 }}
                    >
                      <ListItemIcon className="list-item-icon">
                        <ShowChartIcon />
                      </ListItemIcon>
                      {isOpen && <ListItemText secondary="Трафик" />}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
                )
              }
            </List>
            )
          }

          <Divider />

          <Box className="sidebar-footer">
            <Box display="flex" flexDirection="column" justifyContent="space-between" gap={1}>
              {user && ["intern", "middle_tester", "buyer"].includes(user.role) && (
                <Box className="setting-element">
                  {isOpen ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={
                        user.telegram_user_id ? <Badge
                          overlap="circular"
                          badgeContent={<CheckIcon sx={{ fontSize: 10, color: "#fff" }} />}
                          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                          sx={{
                            "& .MuiBadge-badge": {
                              padding: 0,
                              minWidth: 14,
                              height: 14,
                              borderRadius: "50%",
                              backgroundColor: "#08c500"
                            },
                          }}
                        >
                          <SmartToyOutlinedIcon />
                        </Badge> : <SmartToyOutlinedIcon />
                      }
                      onClick={(e) => setAnchorTelegramBotEl(e.currentTarget)}
                      sx={{
                        borderColor: "#9e9e9e",
                        color: "#777777",
                        textTransform: "none",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "&:hover": {
                          backgroundColor: "#f6f6f6",
                          borderColor: "#9e9e9e",
                        },
                      }}
                    >
                      Telegram-бот
                    </Button>
                  ) : (
                    <Tooltip title="Telegram-бот" placement="right">
                      <IconButton onClick={(e) => setAnchorTelegramBotEl(e.currentTarget)} size="large">
                        {user.telegram_user_id ? <Badge
                          overlap="circular"
                          badgeContent={<CheckIcon sx={{fontSize: 10, color: "#fff"}}/>}
                          anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                          sx={{
                            "& .MuiBadge-badge": {
                              padding: 0,
                              minWidth: 14,
                              height: 14,
                              borderRadius: "50%",
                              backgroundColor: "#08c500"
                            },
                          }}
                        >
                          <SmartToyOutlinedIcon/>
                        </Badge> : <SmartToyOutlinedIcon/> }
                      </IconButton>
                    </Tooltip>
                  )}

                  <Popover
                    open={openTelegramBotPopover}
                    anchorEl={anchorTelegramBotEl}
                    onClose={() => setAnchorTelegramBotEl(null)}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                    PaperProps={{
                      sx: { minWidth: 200 },
                    }}
                  >
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => {
                            window.open(`https://t.me/buyers_dashboard_for_buyer_bot?start=${user.login}`, "_blank");
                            setAnchorTelegramBotEl(null);
                          }}
                        >
                          <ListItemText primary="Привязать Telegram" />
                        </ListItemButton>
                      </ListItem>
                    </List>
                  </Popover>
                </Box>
              )}
            </Box>

            <Box className="sidebar-logout">
              {isOpen ? (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LogoutIcon sx={{ color: "#e53959" }} />}
                  onClick={handleLogout}
                  sx={{
                    borderColor: "#e53959",
                    color: "#e53959",
                    textTransform: "none",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": {
                      backgroundColor: "#fdecef",
                      borderColor: "#d32f2f",
                    },
                  }}
                >
                  Выйти
                </Button>
              ) : (
                <Tooltip title="Выйти" placement="right">
                  <IconButton onClick={handleLogout} size="large">
                    <LogoutIcon sx={{ color: "#e53959" }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
