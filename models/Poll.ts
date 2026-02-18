import mongoose, { Document, Schema, Types } from 'mongoose';

type PollStatus = 'draft' | 'active' | 'ended' | 'cancelled';
type PollType = 'single' | 'multiple' | 'ranked' | 'quiz';
type PollVisibility = 'public' | 'subscribers' | 'followers' | 'private';

export interface IPollOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean; // Para enquetes do tipo quiz
  votes: number;
  percentage?: number;
}

export interface IPollVote {
  userId: Types.ObjectId;
  optionIds: string[];
  votedAt: Date;
  isAnonymous: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface IPoll extends Document {
  calculatePercentages(): unknown;
  question: string;
  description?: string;
  options: IPollOption[];
  creator: Types.ObjectId;
  stream?: Types.ObjectId;
  channel?: Types.ObjectId;
  type: PollType;
  status: PollStatus;
  visibility: PollVisibility;
  allowMultipleVotes: boolean;
  allowChangeVote: boolean;
  allowAnonymousVotes: boolean;
  showResults: boolean; // Se os resultados são visíveis antes de votar
  showLiveResults: boolean; // Se os resultados são atualizados em tempo real
  minSelections: number;
  maxSelections: number;
  startDate: Date;
  endDate?: Date;
  timeLimit?: number; // Em segundos, para enquetes com tempo limitado
  votes: IPollVote[];
  totalVotes: number;
  tags: string[];
  isModerated: boolean;
  requireLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pollOptionSchema = new Schema<IPollOption>({
  id: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  imageUrl: { 
    type: String,
    trim: true
  },
  isCorrect: {
    type: Boolean
  },
  votes: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

const pollVoteSchema = new Schema<IPollVote>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  optionIds: [{
    type: String,
    required: true
  }],
  votedAt: { 
    type: Date, 
    default: Date.now 
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  }
}, { _id: false });

const pollSchema = new Schema<IPoll>(
  {
    question: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 300
    },
    description: { 
      type: String,
      trim: true,
      maxlength: 2000
    },
    options: {
      type: [pollOptionSchema],
      required: true,
      validate: {
        validator: function(v: IPollOption[]) {
          return v.length >= 2 && v.length <= 10; // Entre 2 e 10 opções
        },
        message: 'A enquete deve ter entre 2 e 10 opções.'
      }
    },
    creator: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true
    },
    stream: { 
      type: Schema.Types.ObjectId, 
      ref: 'Stream',
      index: true
    },
    channel: { 
      type: Schema.Types.ObjectId, 
      ref: 'Channel',
      index: true
    },
    type: { 
      type: String, 
      enum: ['single', 'multiple', 'ranked', 'quiz'],
      default: 'single',
      index: true
    },
    status: { 
      type: String, 
      enum: ['draft', 'active', 'ended', 'cancelled'],
      default: 'draft',
      index: true
    },
    visibility: { 
      type: String, 
      enum: ['public', 'subscribers', 'followers', 'private'],
      default: 'public'
    },
    allowMultipleVotes: { 
      type: Boolean, 
      default: false 
    },
    allowChangeVote: { 
      type: Boolean, 
      default: true 
    },
    allowAnonymousVotes: { 
      type: Boolean, 
      default: false 
    },
    showResults: { 
      type: Boolean, 
      default: true 
    },
    showLiveResults: { 
      type: Boolean, 
      default: true 
    },
    minSelections: { 
      type: Number, 
      default: 1,
      min: 1
    },
    maxSelections: { 
      type: Number, 
      default: 1,
      min: 1
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    endDate: { 
      type: Date 
    },
    timeLimit: { 
      type: Number, 
      min: 10 // Mínimo de 10 segundos
    },
    votes: [pollVoteSchema],
    totalVotes: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    isModerated: { 
      type: Boolean, 
      default: false 
    },
    requireLogin: { 
      type: Boolean, 
      default: true 
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
pollSchema.index({ creator: 1, status: 1 });
pollSchema.index({ stream: 1, status: 1 });
pollSchema.index({ channel: 1, status: 1 });
pollSchema.index({ status: 1, startDate: -1 });
pollSchema.index({ 'votes.userId': 1 });

// Middleware para validar minSelections e maxSelections
pollSchema.pre<IPoll>('save', function(next) {
  // Garante que maxSelections não seja maior que o número de opções
  this.maxSelections = Math.min(this.maxSelections, this.options.length);
  
  // Garante que minSelections não seja maior que maxSelections
  this.minSelections = Math.min(this.minSelections, this.maxSelections);
  
  // Se for uma enquete de seleção única, força min e max para 1
  if (this.type === 'single') {
    this.minSelections = 1;
    this.maxSelections = 1;
  }
  
  // Se for uma enquete do tipo quiz, garante que exatamente uma opção esteja marcada como correta
  if (this.type === 'quiz') {
    const correctOptions = this.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      throw new Error('Uma enquete do tipo quiz deve ter exatamente uma opção correta');
    }
  }
});

// Método para adicionar um voto à enquete
pollSchema.methods.addVote = function(
  optionIds: string[],
  userId?: Types.ObjectId,
  isAnonymous: boolean = false,
  requestInfo?: { ip?: string; userAgent?: string }
): IPoll {
  // Verifica se a enquete está ativa
  if (this.status !== 'active') {
    throw new Error('Esta enquete não está ativa no momento');
  }
  
  // Verifica se a enquete já expirou
  if (this.endDate && new Date() > this.endDate) {
    this.status = 'ended';
    throw new Error('Esta enquete já expirou');
  }
  
  // Verifica se o número de seleções está dentro dos limites
  if (optionIds.length < this.minSelections || optionIds.length > this.maxSelections) {
    throw new Error(`Você deve selecionar entre ${this.minSelections} e ${this.maxSelections} opções`);
  }
  
  // Verifica se o usuário já votou (se não for permitido múltiplos votos)
  if (!this.allowMultipleVotes && userId) {
    const hasVoted = this.votes.some(vote => 
      vote.userId && vote.userId.toString() === userId.toString()
    );
    
    if (hasVoted && !this.allowChangeVote) {
      throw new Error('Você já votou nesta enquete');
    }
    
    // Se permitir mudar o voto, remove o voto anterior
    if (hasVoted && this.allowChangeVote) {
      this.removeVote(userId);
    }
  }
  
  // Verifica se as opções selecionadas são válidas
  const validOptionIds = this.options.map(opt => opt.id);
  const invalidOptions = optionIds.filter(id => !validOptionIds.includes(id));
  
  if (invalidOptions.length > 0) {
    throw new Error(`Opções inválidas: ${invalidOptions.join(', ')}`);
  }
  
  // Adiciona o voto
  const vote: IPollVote = {
    userId: userId,
    optionIds,
    votedAt: new Date(),
    isAnonymous,
    ipAddress: requestInfo?.ip,
    userAgent: requestInfo?.userAgent
  };
  
  this.votes.push(vote);
  
  // Atualiza a contagem de votos para cada opção
  optionIds.forEach(optionId => {
    const option = this.options.find((opt: IPollOption) => opt.id === optionId);
    if (option) {
      option.votes += 1;
    }
  });
  
  // Atualiza o total de votos
  this.totalVotes += 1;
  
  // Calcula as porcentagens
  this.calculatePercentages();
  
  return this;
};

// Método para remover um voto
pollSchema.methods.removeVote = function(userId: Types.ObjectId): IPoll {
  const voteIndex = this.votes.findIndex(vote => 
    vote.userId && vote.userId.toString() === userId.toString()
  );
  
  if (voteIndex === -1) {
    return this; // Nenhum voto para remover
  }
  
  const vote = this.votes[voteIndex];
  
  // Remove os votos das opções
  vote.optionIds.forEach(optionId => {
    const option = this.options.find((opt: IPollOption) => opt.id === optionId);
    if (option && option.votes > 0) {
      option.votes -= 1;
    }
  });
  
  // Remove o voto
  this.votes.splice(voteIndex, 1);
  
  // Atualiza o total de votos
  this.totalVotes = Math.max(0, this.totalVotes - 1);
  
  // Recalcula as porcentagens
  this.calculatePercentages();
  
  return this;
};

// Método para calcular as porcentagens de cada opção
pollSchema.methods.calculatePercentages = function(): void {
  if (this.totalVotes === 0) {
    this.options.forEach((option: IPollOption) => {
      option.percentage = 0;
    });
    return;
  }
  
  this.options.forEach((option: IPollOption) => {
    option.percentage = Math.round((option.votes / this.totalVotes) * 100);
  });
};

// Método para encerrar a enquete
pollSchema.methods.endPoll = function(): IPoll {
  if (this.status === 'ended') {
    return this; // Já está encerrada
  }
  
  this.status = 'ended';
  this.endDate = new Date();
  
  return this;
};

// Método para reabrir a enquete
pollSchema.methods.reopenPoll = function(): IPoll {
  if (this.status !== 'ended') {
    return this; // Já está ativa
  }
  
  this.status = 'active';
  this.endDate = undefined;
  
  return this;
};

// Hook pós-save para garantir que as porcentagens estejam sempre calculadas
pollSchema.post<IPoll>('save', async function(doc) {
  try {
    if (doc) {
      doc.calculatePercentages();
      if (doc.isModified()) {
        await doc.save();
      }
    }
  } catch (error) {
    console.error('Error in post-save hook:', error);
  }
});

const Poll = mongoose.model<IPoll>('Poll', pollSchema);
export default Poll;
