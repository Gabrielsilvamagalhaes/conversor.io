import type { ConversionJobRepositoryPort } from "@/domain/conversion/ports/conversion-job-repository.port";
import { type ConversionHistoryDto, toConversionJobDto } from "./conversion-history.dto";

export interface ListConversionsInput {
  readonly userId: string;
  readonly limit: number;
  readonly cursor?: string;
}

/** Lista o histórico de conversões de um usuário, paginado, como DTO plano. */
export class ListConversionsUseCase {
  constructor(private readonly repository: ConversionJobRepositoryPort) {}

  async execute(input: ListConversionsInput): Promise<ConversionHistoryDto> {
    const page = await this.repository.listByUser(input.userId, {
      limit: input.limit,
      cursor: input.cursor,
    });

    return {
      items: page.jobs.map(toConversionJobDto),
      nextCursor: page.nextCursor,
    };
  }
}
