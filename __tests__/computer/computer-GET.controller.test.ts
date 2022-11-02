/* eslint-disable no-underscore-dangle */
/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ComputerModel } from '../../src/computer/rest/computer-get.controller.js';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const modellVorhanden = ['k', 'g', 't'];
const modellNichtVorhanden = ['xx', 'yy'];
const farbeVorhanden = ['rot', 'schwarz'];
const farbeNichtVorhanden = ['gelb', 'pink'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle computers', async () => {
        // given

        // when
        const response: AxiosResponse<computersModel> = await client.get('/');

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { computers } = data._embedded;

        computers
            .map((buch) => buch._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'u'));
            });
    });

    each(modellVorhanden).test(
        'Computer mit Modellbezeichnung, die "%s" enthaelt',
        async (teilModell: string) => {
            // given
            const params = { titel: teilModell };

            // when
            const response: AxiosResponse<ComputerModel> = await client.get(
                '/',
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { computers } = data._embedded;

            // Jedes Buch hat einen Titel mit dem Teilstring 'a'
            computers
                .map((computer) => computer.modell)
                .forEach((modell: string) =>
                    expect(modell.toLowerCase()).toEqual(
                        expect.stringContaining(teilModell),
                    ),
                );
        },
    );

    each(farbeNichtVorhanden).test(
        'Keine computers mit einem Titel, der "%s" enthaelt',
        async (teilModell: string) => {
            // given
            const params = { titel: teilModell };

            // when
            const response: AxiosResponse<string> = await client.get('/', {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    each(farbeVorhanden)
        .test(
            'Mind. 1 Buch mit dem Schlagwort "%s"',
            async (schlagwort: string) => {
                // given
                const params = { [schlagwort]: 'true' };

                // when
                const response: AxiosResponse<ComputerModel> = await client.get(
                    '/',
                    { params },
                );

                // then
                const { status, headers, data } = response;

                expect(status).toBe(HttpStatus.OK);
                expect(headers['content-type']).toMatch(/json/iu);
                // JSON-Array mit mind. 1 JSON-Objekt
                expect(data).toBeDefined();

                const { computers } = data._embedded;

                // Jedes Buch hat im Array der Schlagwoerter z.B. "javascript"
                computers
                    .map((computer) => computer.farbe)
                    .forEach((farbe) =>
                        expect(farbe).toEqual(
                            expect.arrayContaining([farbe.toUpperCase()]),
                        ),
                    );
            },
            farbe,
        )
        .test(
            'Keine computers mit dem Schlagwort "%s"',
            async (schlagwort: string) => {
                // given
                const params = { [schlagwort]: 'true' };

                // when
                const response: AxiosResponse<string> = await client.get('/', {
                    params,
                });

                // then
                const { status, data } = response;

                expect(status).toBe(HttpStatus.NOT_FOUND);
                expect(data).toMatch(/^not found$/iu);
            },
        );

    test('Keine computers zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get('/', {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
/* eslint-enable no-underscore-dangle */
