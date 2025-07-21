/**
 * Web Routes - Frontend pages with Handlebars templates
 */

import { Router } from 'express';
import { WebController } from '../controllers/web.controller';

export function createWebRoutes(): Router {
  const router = Router();
  const webController = new WebController();

  // ==========================================
  // PUBLIC ROUTES (No authentication required)
  // ==========================================

  /**
   * @route   GET /
   * @desc    Home page - redirect based on auth status
   * @access  Public
   */
  router.get('/', webController.home.bind(webController));

  /**
   * @route   GET /login
   * @desc    Login page
   * @access  Public
   */
  router.get('/login', webController.loginPage.bind(webController));

  /**
   * @route   GET /register
   * @desc    Register page
   * @access  Public
   */
  router.get('/register', webController.registerPage.bind(webController));

  // ==========================================
  // PROTECTED ROUTES (Authentication required)
  // ==========================================
  // Note: In production, add authentication middleware here
  // router.use(authenticateToken);

  /**
   * @route   GET /dashboard
   * @desc    Admin dashboard page
   * @access  Private
   */
  router.get('/dashboard', webController.dashboardPage.bind(webController));

  /**
   * @route   GET /products
   * @desc    Products management page
   * @access  Private
   */
  router.get('/products', webController.productsPage.bind(webController));

  /**
   * @route   GET /orders
   * @desc    Orders management page
   * @access  Private
   */
  router.get('/orders', webController.ordersPage.bind(webController));

  /**
   * @route   GET /pos
   * @desc    POS interface page
   * @access  Private
   */
  router.get('/pos', webController.posPage.bind(webController));

  /**
   * @route   GET /stock
   * @desc    Stock management page
   * @access  Private (Admin/Manager)
   */
  router.get('/stock', webController.stockPage.bind(webController));

  /**
   * @route   GET /users
   * @desc    Users management page
   * @access  Private (Admin only)
   */
  router.get('/users', webController.usersPage.bind(webController));

  return router;
}
