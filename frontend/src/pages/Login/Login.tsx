import { HiUser, HiKey } from 'react-icons/hi2'
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  InputAdornment, Typography,
} from '@mui/material'

import './Login.scss'

import { useState } from 'react'
import { useAppDispatch } from "../../utils/store/hooks.ts"
import { loginUser } from "../../utils/API/authAPI.ts"
import {useNavigate} from "react-router-dom";

const Login = () => {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setIsConfirmed(true)

    if (!login || !password) return

    const res = await dispatch(loginUser(login, password))

    if (!res) {
      setError("Неправильный логин или пароль")
    } else {
      navigate("/")
      setError(null)
    }
  };

  return (
    <Box className="login-page">
      <Container className="login-container" maxWidth={false}>
        <Paper className="login-card">
          <Box className="login-inputs">
            <TextField
              fullWidth
              placeholder="Логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="input-field"
              error={Boolean(isConfirmed && !login)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HiUser />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              error={Boolean(isConfirmed && !password)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HiKey />
                  </InputAdornment>
                ),
              }}
            />

            {error && isConfirmed && (
              <Typography variant="body2" color="error" sx={{ pl: '4px' }}>
                {error}
              </Typography>
            )}

            <Button fullWidth size="large" onClick={handleSubmit} variant="contained" >
              Войти
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
