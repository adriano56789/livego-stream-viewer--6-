import mongoose, { Document, Schema, Types } from 'mongoose';

type AnalyticsType = 'page_view' | 'stream_start' | 'stream_end' | 'user_signup' | 'user_login' | 'purchase' | 'subscription' | 'ad_impression' | 'ad_click' | 'custom';
type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'smart_tv' | 'game_console' | 'other';
type PlatformType = 'web' | 'ios' | 'android' | 'smart_tv' | 'desktop_app' | 'other';

export interface IAnalyticsEvent extends Document {
  eventType: AnalyticsType;
  user?: Types.ObjectId;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  device: {
    type: DeviceType;
    name?: string;
    version?: string;
  };
  platform: {
    type: PlatformType;
    name?: string;
    version?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  referrer?: string;
  pageUrl: string;
  pageTitle?: string;
  metadata: Record<string, any>;
  // Timestamps
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'page_view', 'stream_start', 'stream_end', 'user_signup', 
        'user_login', 'purchase', 'subscription', 'ad_impression', 
        'ad_click', 'custom'
      ],
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      index: true
    },
    userAgent: String,
    device: {
      type: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'smart_tv', 'game_console', 'other'],
        required: true,
        default: 'other'
      },
      name: String,
      version: String
    },
    platform: {
      type: {
        type: String,
        enum: ['web', 'ios', 'android', 'smart_tv', 'desktop_app', 'other'],
        required: true,
        default: 'web'
      },
      name: String,
      version: String
    },
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number
    },
    referrer: String,
    pageUrl: {
      type: String,
      required: true,
      index: true
    },
    pageTitle: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { 
      createdAt: true, 
      updatedAt: false 
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para consultas comuns
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ 'device.type': 1, createdAt: -1 });
analyticsEventSchema.index({ 'platform.type': 1, createdAt: -1 });
analyticsEventSchema.index({ 'location.country': 1, createdAt: -1 });

// Método estático para registrar um evento de análise
analyticsEventSchema.statics.recordEvent = function(
  eventType: AnalyticsType,
  data: {
    user?: Types.ObjectId;
    sessionId: string;
    ipAddress?: string;
    userAgent?: string;
    device?: {
      type: DeviceType;
      name?: string;
      version?: string;
    };
    platform?: {
      type: PlatformType;
      name?: string;
      version?: string;
    };
    location?: {
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    referrer?: string;
    pageUrl: string;
    pageTitle?: string;
    metadata?: Record<string, any>;
  }
) {
  const event = new AnalyticsEvent({
    eventType,
    user: data.user,
    sessionId: data.sessionId,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    device: {
      type: data.device?.type || 'other',
      name: data.device?.name,
      version: data.device?.version
    },
    platform: {
      type: data.platform?.type || 'web',
      name: data.platform?.name,
      version: data.platform?.version
    },
    location: data.location,
    referrer: data.referrer,
    pageUrl: data.pageUrl,
    pageTitle: data.pageTitle,
    metadata: data.metadata || {}
  });
  
  return event.save();
};

// Método estático para obter estatísticas de eventos
analyticsEventSchema.statics.getEventStats = async function(
  eventType: AnalyticsType | AnalyticsType[],
  options: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'hour' | 'day' | 'week' | 'month' | 'year';
    filter?: Record<string, any>;
    limit?: number;
    skip?: number;
  } = {}
) {
  const {
    startDate,
    endDate = new Date(),
    groupBy = 'day',
    filter = {},
    limit = 100,
    skip = 0
  } = options;
  
  const match: any = { ...filter };
  
  // Filtrar por tipo de evento
  if (eventType) {
    if (Array.isArray(eventType)) {
      match.eventType = { $in: eventType };
    } else {
      match.eventType = eventType;
    }
  }
  
  // Filtrar por data
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  // Definir agrupamento por período
  let dateFormat = '';
  switch (groupBy) {
    case 'hour':
      dateFormat = '%Y-%m-%dT%H:00:00.000Z';
      break;
    case 'week':
      dateFormat = '%Y-%W';
      break;
    case 'month':
      dateFormat = '%Y-%m-01T00:00:00.000Z';
      break;
    case 'year':
      dateFormat = '%Y-01-01T00:00:00.000Z';
      break;
    case 'day':
    default:
      dateFormat = '%Y-%m-%dT00:00:00.000Z';
      break;
  }
  
  const pipeline: any[] = [
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: '$createdAt',
            timezone: 'UTC'
          }
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        uniqueSessions: { $addToSet: '$sessionId' },
        firstEvent: { $min: '$createdAt' },
        lastEvent: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' },
        firstEvent: 1,
        lastEvent: 1
      }
    },
    { $sort: { date: 1 } },
    { $skip: skip },
    { $limit: limit }
  ];
  
  const [results, total] = await Promise.all([
    this.aggregate(pipeline),
    this.countDocuments(match)
  ]);
  
  return {
    total,
    results,
    hasMore: total > skip + limit
  };
};

// Método estático para obter estatísticas de usuários ativos
analyticsEventSchema.statics.getActiveUsers = async function(
  period: 'day' | 'week' | 'month' = 'day',
  options: {
    startDate?: Date;
    endDate?: Date;
    filter?: Record<string, any>;
  } = {}
) {
  const { startDate, endDate = new Date(), filter = {} } = options;
  
  const match: any = { ...filter };
  
  // Definir período
  const periodStart = new Date(endDate);
  switch (period) {
    case 'day':
      periodStart.setDate(periodStart.getDate() - 1);
      break;
    case 'week':
      periodStart.setDate(periodStart.getDate() - 7);
      break;
    case 'month':
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
  }
  
  match.createdAt = { $gte: periodStart, $lte: endDate };
  
  // Se for fornecido um startDate, usar como limite mínimo
  if (startDate && startDate > periodStart) {
    match.createdAt.$gte = startDate;
  }
  
  // Pipeline para usuários ativos (MAU/WAU/DAU)
  const activeUsersPipeline = [
    { $match: { ...match, user: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: {
          user: '$user',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'UTC'
            }
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.user',
        lastActive: { $max: '$_id.date' },
        activeDays: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgActiveDays: { $avg: '$activeDays' },
        users: {
          $push: {
            userId: '$_id',
            lastActive: '$lastActive',
            activeDays: '$activeDays'
          }
        }
      }
    }
  ];
  
  // Pipeline para novas contas (signups)
  const newUsersPipeline = [
    { 
      $match: { 
        eventType: 'user_signup',
        createdAt: match.createdAt 
      } 
    },
    { $group: { _id: null, count: { $sum: 1 } } }
  ];
  
  // Pipeline para sessões
  const sessionsPipeline = [
    { $match: match },
    { $group: { _id: '$sessionId' } },
    { $group: { _id: null, count: { $sum: 1 } } }
  ];
  
  const [activeUsersResult, newUsersResult, sessionsResult] = await Promise.all([
    this.aggregate(activeUsersPipeline),
    this.aggregate(newUsersPipeline),
    this.aggregate(sessionsPipeline)
  ]);
  
  return {
    activeUsers: activeUsersResult[0]?.total || 0,
    avgActiveDays: activeUsersResult[0]?.avgActiveDays || 0,
    newUsers: newUsersResult[0]?.count || 0,
    totalSessions: sessionsResult[0]?.count || 0,
    period: {
      start: match.createdAt.$gte,
      end: match.createdAt.$lte
    }
  };
};

// Método estático para obter estatísticas de retenção
analyticsEventSchema.statics.getRetentionStats = async function(
  startDate: Date,
  endDate: Date,
  period: 'day' | 'week' | 'month' = 'day'
) {
  // Calcular o intervalo de datas baseado no período
  const dateFormat = period === 'day' ? '%Y-%m-%d' : 
                    period === 'week' ? '%Y-%W' : '%Y-%m';
  
  // Pipeline para obter a primeira atividade dos usuários
  const firstActivityPipeline = [
    {
      $match: {
        user: { $exists: true, $ne: null },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$user',
        firstActivity: { $min: '$createdAt' },
        firstActivityDate: {
          $dateToString: {
            format: dateFormat,
            date: { $min: '$createdAt' },
            timezone: 'UTC'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        firstActivity: 1,
        firstActivityDate: 1
      }
    }
  ];

  // Obter todos os usuários com sua primeira atividade
  const firstActivities = await this.aggregate(firstActivityPipeline);
  
  // Se não houver atividades, retornar vazio
  if (firstActivities.length === 0) {
    return {
      startDate,
      endDate,
      period,
      retentionRates: []
    };
  }

  // Agrupar usuários por período de primeira atividade
  const cohorts = firstActivities.reduce((acc, { userId, firstActivity, firstActivityDate }) => {
    if (!acc[firstActivityDate]) {
      acc[firstActivityDate] = {
        cohort: firstActivityDate,
        totalUsers: 0,
        users: [],
        retention: {}
      };
    }
    acc[firstActivityDate].totalUsers++;
    acc[firstActivityDate].users.push(userId);
    return acc;
  }, {} as Record<string, any>);

  // Para cada coorte, verificar a retenção em cada período subsequente
  const cohortDates = Object.keys(cohorts);
  const retentionRates = [];

  for (const cohortDate of cohortDates) {
    const cohort = cohorts[cohortDate];
    const cohortStart = new Date(cohortDate.includes('W') 
      ? `${cohortDate}-1` // Para semanas, assumindo que o primeiro dia é segunda-feira
      : cohortDate);
    
    // Calcular retenção para cada período subsequente
    let currentDate = new Date(cohortStart);
    const retentionByPeriod: Record<string, {
      period: string;
      startDate: Date;
      endDate: Date;
      activeUsers: number;
      retentionRate: number;
    }> = {};
    
    // Calcular a retenção para até 12 períodos
    for (let i = 0; i < 12; i++) {
      // Calcular a data final do período atual
      const periodEnd = new Date(currentDate);
      const periodStart = new Date(currentDate);
      
      // Ajustar a data final com base no período
      if (period === 'day') {
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (period === 'week') {
        periodStart.setDate(periodStart.getDate() - periodStart.getDay() + (periodStart.getDay() === 0 ? -6 : 1));
        periodEnd.setDate(periodStart.getDate() + 7);
      } else { // month
        periodStart.setDate(1);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Último dia do mês
      }
      
      // Se a data final ultrapassar a data final do relatório, parar
      if (periodStart > endDate) break;
      
      // Contar usuários ativos neste período
      const activeUsers = await this.countDocuments({
        user: { $in: cohort.users },
        createdAt: {
          $gte: periodStart,
          $lt: periodEnd
        }
      });
      
      // Calcular taxa de retenção
      const retentionRate = cohort.totalUsers > 0 
        ? (activeUsers / cohort.totalUsers) * 100 
        : 0;
      
      // Formatar período para exibição
      const periodLabel = period === 'day' 
        ? periodStart.toISOString().split('T')[0]
        : period === 'week' 
          ? `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`
          : periodStart.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      retentionByPeriod[`period_${i}`] = {
        period: periodLabel,
        startDate: periodStart,
        endDate: periodEnd,
        activeUsers,
        retentionRate: parseFloat(retentionRate.toFixed(2))
      };
      
      // Mover para o próximo período
      if (period === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (period === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Se ultrapassou a data final, parar
      if (currentDate > endDate) break;
    }
    
    retentionRates.push({
      cohort: cohortDate,
      cohortSize: cohort.totalUsers,
      retention: retentionByPeriod
    });
  }
  
  return {
    startDate,
    endDate,
    period,
    totalCohorts: retentionRates.length,
    retentionRates: retentionRates.sort((a, b) => a.cohort.localeCompare(b.cohort))
  };
};

// Método estático para limpar eventos antigos
analyticsEventSchema.statics.cleanupOldEvents = async function(olderThanDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  return {
    deletedCount: result.deletedCount,
    cutoffDate
  };
};

const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
