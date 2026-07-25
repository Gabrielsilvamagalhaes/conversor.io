import type { ConversionJobRepositoryPort } from "@/domain/conversion/ports/conversion-job-repository.port";

export interface CountConversionsSinceInput {
  readonly userId: string;
  readonly since: Date;
}

/**
 * Conta quantas conversões um usuário registrou a partir de uma data. Use case fino,
 * dedicado a alimentar o rate limit simples de `POST /api/conversions` — o contador em
 * si já existe no `ConversionJobRepositoryPort` (`countByUserSince`), aqui só expomos
 * essa operação para a presentation sem vazar o repositório para fora do container.
 */
export class CountConversionsSinceUseCase {
  constructor(private readonly repository: ConversionJobRepositoryPort) {}

  execute(input: CountConversionsSinceInput): Promise<number> {
    return this.repository.countByUserSince(input.userId, input.since);
  }
}
