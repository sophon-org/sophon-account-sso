import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Request } from "express";
import type { AccessTokenPayload } from "../../auth/types";
import { AccessTokenGuard } from "../../auth/guards/access-token.guard";
import { ConsentsService } from "../../consents/consents.service";
import { ConsentKind } from "../../consents/dto/consent-kind.enum";
import { ConsentController } from "../consent.controller";

describe("ConsentController", () => {
  let controller: ConsentController;

  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const consentsServiceMock = {
    getActiveConsents: jest.fn(),
    give: jest.fn(),
    giveMany: jest.fn(),
    revoke: jest.fn(),
    revokeMany: jest.fn(),
  };

  const reqWithUser = (userId?: string) =>
    ({
      user: (userId ? { userId } : {}) as AccessTokenPayload,
    }) as unknown as Request & { user: AccessTokenPayload };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConsentController],
      providers: [
        { provide: ConsentsService, useValue: consentsServiceMock },
        { provide: "PinoLogger:ConsentController", useValue: loggerMock },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(ConsentController);
    jest.clearAllMocks();
  });

  it("GET /me/consent → lists active consents mapped to ISO", async () => {
    const now1 = new Date("2025-01-01T00:00:00.000Z");
    const now2 = new Date("2025-01-02T00:00:00.000Z");
    consentsServiceMock.getActiveConsents.mockResolvedValue([
      { kind: ConsentKind.PERSONALIZATION_ADS, startTime: now1 },
      { kind: ConsentKind.SHARING_DATA, startTime: now2 },
    ]);

    const out = await controller.list(reqWithUser("u1"));

    expect(consentsServiceMock.getActiveConsents).toHaveBeenCalledWith("u1");
    expect(out).toEqual([
      { kind: ConsentKind.PERSONALIZATION_ADS, startTime: now1.toISOString() },
      { kind: ConsentKind.SHARING_DATA,        startTime: now2.toISOString() },
    ]);
  });

  it("POST /me/consent → give single consent", async () => {
    const ts = new Date("2025-01-03T00:00:00.000Z");
    consentsServiceMock.give.mockResolvedValue({
      kind: ConsentKind.PERSONALIZATION_ADS,
      startTime: ts,
    });

    const out = await controller.give(
      { kind: ConsentKind.PERSONALIZATION_ADS },
      reqWithUser("u1"),
    );

    expect(consentsServiceMock.give).toHaveBeenCalledWith("u1", ConsentKind.PERSONALIZATION_ADS);
    expect(out).toEqual({
      kind: ConsentKind.PERSONALIZATION_ADS,
      startTime: ts.toISOString(),
    });
  });

  it("POST /me/consent/giveMany → grants multiple consents in one call", async () => {
    const ts1 = new Date("2025-01-04T00:00:00.000Z");
    const ts2 = new Date("2025-01-05T00:00:00.000Z");
    consentsServiceMock.giveMany.mockResolvedValue([
      { kind: ConsentKind.PERSONALIZATION_ADS, startTime: ts1 },
      { kind: ConsentKind.SHARING_DATA,        startTime: ts2 },
    ]);

    const kinds = [ConsentKind.PERSONALIZATION_ADS, ConsentKind.SHARING_DATA];
    const out = await controller.giveMany({ kinds }, reqWithUser("u1"));

    expect(consentsServiceMock.giveMany).toHaveBeenCalledWith("u1", kinds);
    expect(out).toEqual([
      { kind: ConsentKind.PERSONALIZATION_ADS, startTime: ts1.toISOString() },
      { kind: ConsentKind.SHARING_DATA,        startTime: ts2.toISOString() },
    ]);
  });

  it("DELETE /me/consent/:kind → revokes single consent", async () => {
    consentsServiceMock.revoke.mockResolvedValue(true);

    const out = await controller.revoke(ConsentKind.PERSONALIZATION_ADS, reqWithUser("u1"));

    expect(consentsServiceMock.revoke).toHaveBeenCalledWith("u1", ConsentKind.PERSONALIZATION_ADS);
    expect(out).toEqual({ ok: true, changed: true });
  });

  it("POST /me/consent/revokeMany → revokes multiple consents", async () => {
    consentsServiceMock.revokeMany.mockResolvedValue({ changed: 2 });

    const kinds = [ConsentKind.PERSONALIZATION_ADS, ConsentKind.SHARING_DATA];
    const out = await controller.revokeMany({ kinds }, reqWithUser("u1"));

    expect(consentsServiceMock.revokeMany).toHaveBeenCalledWith("u1", kinds);
    expect(out).toEqual({ ok: true, changed: 2 });
  });

  it("throws BadRequestException if userId missing in JWT (list)", async () => {
    await expect(controller.list(reqWithUser(undefined))).rejects.toBeInstanceOf(BadRequestException);
    expect(consentsServiceMock.getActiveConsents).not.toHaveBeenCalled();
  });

  it("throws BadRequestException if userId missing in JWT (giveMany)", async () => {
    await expect(
      controller.giveMany({ kinds: [ConsentKind.SHARING_DATA] }, reqWithUser(undefined)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(consentsServiceMock.giveMany).not.toHaveBeenCalled();
  });
});
