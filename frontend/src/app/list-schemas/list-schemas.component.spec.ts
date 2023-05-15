import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSchemasComponent } from './list-schemas.component';

describe('ListSchemasComponent', () => {
  let component: ListSchemasComponent;
  let fixture: ComponentFixture<ListSchemasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListSchemasComponent]
    });
    fixture = TestBed.createComponent(ListSchemasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
