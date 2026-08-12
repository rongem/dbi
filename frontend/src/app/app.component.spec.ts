import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { AppStore } from './lib/store/app-store.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  const store = {
    working: signal(false),
    userName: signal('demo-user'),
    notAuthorized: signal(false),
    databaseName: signal('DemoDB'),
    retrieveUser: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [{ provide: AppStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('loads the current user on init', () => {
    expect(store.retrieveUser).toHaveBeenCalledTimes(1);
  });

  it('shows the active database and user in the toolbar', () => {
    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('DemoDB');
    expect(native.textContent).toContain('demo-user');
  });

  it('hides the main content when the user is not authorized', () => {
    store.notAuthorized.set(true);
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('#main-content');
    expect(main).toBeNull();
  });
});
