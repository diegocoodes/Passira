// Configure apenas regiões atendidas e taxas confirmadas, em centavos.
// null significa PENDENTE e impede concluir uma entrega. Zero deve ser explícito.
export type DeliveryRegion = { id: string; name: string; neighborhoods: string[]; feeCents: number | null };
export const deliveryRegions: DeliveryRegion[] = [];
