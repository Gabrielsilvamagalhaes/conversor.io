import type { ConversionJobRepositoryPort } from "@/domain/conversion/ports/conversion-job-repository.port";
import type { ConversionStatsDto } from "./conversion-history.dto";

export interface GetConversionStatsInput {
  readonly userId: string;
}

/**
 * Estatísticas agregadas do histórico de um usuário, para o dashboard. `ConversionStats`
 * (domain) já é 100% primitivo — o DTO só formaliza o contrato exposto pela aplicação.
 */
export class GetConversionStatsUseCase {
  constructor(private readonly repository: ConversionJobRepositoryPort) {}

  async execute(input: GetConversionStatsInput): Promise<ConversionStatsDto> {
    return this.repository.statsByUser(input.userId);
  }
}
