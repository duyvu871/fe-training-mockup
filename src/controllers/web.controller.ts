/**
 * Web Controller - Handles frontend pages
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class WebController {
  
  /**
   * Home page - redirect to login or dashboard based on auth status
   * GET /
   */
  async home(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is authenticated (from cookie or session)
      const isAuthenticated = req.cookies?.accessToken || false;
      
      if (isAuthenticated) {
        res.redirect('/dashboard');
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      logger.error('Home page error', { error });
      next(error);
    }
  }

  /**
   * Login page
   * GET /login
   */
  async loginPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/login', {
        title: 'Đăng nhập - POS System',
        layout: 'main',
        pageClass: 'login-page',
        pageScript: 'login',
        hideNav: true,
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Login page error', { error });
      next(error);
    }
  }

  /**
   * Register page
   * GET /register
   */
  async registerPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/register', {
        title: 'Đăng ký - POS System',
        layout: 'main',
        pageClass: 'register-page',
        pageScript: 'register',
        hideNav: true,
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Register page error', { error });
      next(error);
    }
  }

  /**
   * Dashboard page
   * GET /dashboard
   */
  async dashboardPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/dashboard', {
        title: 'Bảng điều khiển - POS System',
        layout: 'admin',
        pageClass: 'dashboard-page',
        pageScript: 'dashboard',
        currentPage: 'dashboard',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Dashboard page error', { error });
      next(error);
    }
  }

  /**
   * Products management page
   * GET /products
   */
  async productsPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/products', {
        title: 'Quản lý sản phẩm - POS System',
        layout: 'admin',
        pageClass: 'products-page',
        pageScript: 'products',
        currentPage: 'products',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Products page error', { error });
      next(error);
    }
  }

  /**
   * Orders management page
   * GET /orders
   */
  async ordersPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/orders', {
        title: 'Quản lý đơn hàng - POS System',
        layout: 'admin',
        pageClass: 'orders-page',
        pageScript: 'orders',
        currentPage: 'orders',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Orders page error', { error });
      next(error);
    }
  }

  /**
   * POS interface page
   * GET /pos
   */
  async posPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/pos', {
        title: 'Bán hàng - POS System',
        layout: 'pos',
        pageClass: 'pos-page',
        pageScript: 'pos',
        currentPage: 'pos',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('POS page error', { error });
      next(error);
    }
  }

  /**
   * Stock management page
   * GET /stock
   */
  async stockPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/stock', {
        title: 'Quản lý kho - POS System',
        layout: 'admin',
        pageClass: 'stock-page',
        currentPage: 'stock',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Stock page error', { error });
      next(error);
    }
  }

  /**
   * Users management page (Admin only)
   * GET /users
   */
  async usersPage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.render('pages/users', {
        title: 'Quản lý người dùng - POS System',
        layout: 'admin',
        pageClass: 'users-page',
        currentPage: 'users',
        apiBaseUrl: `/api`,
        environment: config.app.env
      });
    } catch (error) {
      logger.error('Users page error', { error });
      next(error);
    }
  }
}
