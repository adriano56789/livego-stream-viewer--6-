import { Request, Response } from 'express';
import User from '../routes/models/User';
import Report from '../routes/models/Report';
import Withdrawal from '../routes/models/Withdrawal';
import { NotFoundError } from '../errors/request-validation-error';

// Get all users
export const getUsers = async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query = search 
        ? { 
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } 
        : {};

    const [users, total] = await Promise.all([
        User.find(query)
            .select('-password -refreshToken')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        User.countDocuments(query)
    ]);

    res.json({
        users,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
    });
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
        throw new NotFoundError('User not found');
    }
    res.json(user);
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
    const { username, email, role, isBanned } = req.body;
    
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { username, email, role, isBanned },
        { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.json(user);
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    res.json({ message: 'User deleted successfully' });
};

// Ban user
export const banUser = async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: true, banReason: req.body.reason },
        { new: true }
    );
    
    if (!user) {
        throw new NotFoundError('User not found');
    }
    
    res.json({ message: 'User banned successfully' });
};

// Unban user
export const unbanUser = async (req: Request, res: Response) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isBanned: false, banReason: undefined },
        { new: true }
    );
    
    if (!user) {
        throw new NotFoundError('User not found');
    }
    
    res.json({ message: 'User unbanned successfully' });
};

// Get reports
export const getReports = async (req: Request, res: Response) => {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const [reports, total] = await Promise.all([
        Report.find(query)
            .populate('reportedBy', 'username avatar')
            .populate('reportedUser', 'username avatar')
            .populate('stream', 'title')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Report.countDocuments(query)
    ]);
    
    res.json({
        reports,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
    });
};

// Resolve report
export const resolveReport = async (req: Request, res: Response) => {
    const { action, note } = req.body;
    
    const report = await Report.findByIdAndUpdate(
        req.params.id,
        { 
            status: 'resolved',
            resolvedAt: new Date(),
            resolvedBy: req.user?.id,
            actionTaken: action,
            resolutionNote: note
        },
        { new: true }
    );
    
    if (!report) {
        throw new NotFoundError('Report not found');
    }
    
    // Aqui você pode adicionar lógica adicional com base na ação tomada
    // Por exemplo, banir usuário, remover conteúdo ofensivo, etc.
    
    res.json({ message: 'Report resolved successfully', report });
};

// Get system statistics
export const getSystemStats = async (req: Request, res: Response) => {
    const [
        totalUsers,
        activeUsers,
        totalStreams,
        activeStreams,
        totalRevenue,
        pendingWithdrawals,
        totalReports,
        openReports
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        // Adicione as outras consultas conforme necessário
        Promise.resolve(0), // totalStreams
        Promise.resolve(0), // activeStreams
        Promise.resolve(0), // totalRevenue
        Withdrawal.countDocuments({ status: 'pending' }),
        Report.countDocuments(),
        Report.countDocuments({ status: 'open' })
    ]);
    
    res.json({
        users: { total: totalUsers, active: activeUsers },
        streams: { total: totalStreams, active: activeStreams },
        financial: { totalRevenue, pendingWithdrawals },
        moderation: { totalReports, openReports }
    });
};

// Get moderation logs
export const getModerationLogs = async (req: Request, res: Response) => {
    // Implemente a lógica para buscar logs de moderação
    res.json({ message: 'Moderation logs endpoint' });
};

// Update system settings
export const updateSystemSettings = async (req: Request, res: Response) => {
    // Implemente a lógica para atualizar configurações do sistema
    res.json({ message: 'System settings updated' });
};

// Send global announcement
export const sendGlobalAnnouncement = async (req: Request, res: Response) => {
    const { title, message, type = 'info' } = req.body;
    // Implemente a lógica para enviar um anúncio global
    res.json({ message: 'Announcement sent successfully' });
};

// Get withdrawal requests
export const getWithdrawalRequests = async (req: Request, res: Response) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const query: any = {};
    if (status) query.status = status;
    
    const [withdrawals, total] = await Promise.all([
        Withdrawal.find(query)
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Withdrawal.countDocuments(query)
    ]);
    
    res.json({
        withdrawals,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
    });
};

// Process withdrawal
export const processWithdrawal = async (req: Request, res: Response) => {
    const { status, adminNote } = req.body;
    
    const withdrawal = await Withdrawal.findByIdAndUpdate(
        req.params.id,
        { 
            status,
            processedAt: new Date(),
            processedBy: req.user?.id,
            adminNote
        },
        { new: true }
    );
    
    if (!withdrawal) {
        throw new NotFoundError('Withdrawal not found');
    }
    
    // Atualizar o saldo do usuário se o saque for rejeitado
    if (status === 'rejected') {
        await User.findByIdAndUpdate(
            withdrawal.user,
            { $inc: { balance: withdrawal.amount } }
        );
    }
    
    res.json({ message: `Withdrawal ${status} successfully`, withdrawal });
};

// Get admin earnings
export const getAdminEarnings = async (req: Request, res: Response) => {
    // Implemente a lógica para buscar os ganhos do administrador
    res.json({ message: 'Admin earnings endpoint' });
};

// Request admin withdrawal
export const requestAdminWithdrawal = async (req: Request, res: Response) => {
    // Implemente a lógica para solicitar saque de administrador
    res.json({ message: 'Withdrawal requested successfully' });
};

// Get admin withdrawal history
export const getAdminWithdrawalHistory = async (req: Request, res: Response) => {
    // Implemente a lógica para buscar o histórico de saques do administrador
    res.json({ message: 'Admin withdrawal history endpoint' });
};
