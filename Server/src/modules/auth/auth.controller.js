// src/modules/auth/auth.controller.js
// Handles HTTP request/response parsing for authentication endpoints.

import { asyncHandler } from '../../utils/async-handler.js';
import * as authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body);
  res.status(204).send();
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.userId);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateMe(req.userId, req.body);
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.userId, req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await authService.deleteMe(req.userId, req.body);
  res.status(204).send();
});

export const sendTestEmail = asyncHandler(async (req, res) => {
  const result = await authService.sendTestEmail(req.userId);
  res.status(200).json({
    success: true,
    data: result,
  });
});
